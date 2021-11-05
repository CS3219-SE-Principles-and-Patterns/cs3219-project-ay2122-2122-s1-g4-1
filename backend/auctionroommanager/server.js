const { createAdapter } = require("@socket.io/redis-adapter");
//const { createClient } = require("redis");
const Redis = require("ioredis");
const { RateLimiterRedis } = require('rate-limiter-flexible');
const server = require("http").createServer();
const axios = require('axios');

var redis_cluster_url = process.env.redis_cluster_url
console.log(redis_cluster_url);
//internal urls within kubernetes cluster
// const roomstorageurl = "http://localhost:3000/api/room/"
const roomstorageurl = 'http://auctionroom.default.svc.cluster.local:8083/api/room/'
// const authurl = 'http://localhost:30198/api/user/user'
const authurl = 'http://useraccount.default.svc.cluster.local:8080/api/user/user'
// const auctiondetailurl = 'http://localhost:30200/api/auctiondetails/'
const auctiondetailurl = 'http://auctiondetails.default.svc.cluster.local:8081/api/auctiondetails/'
// const redisClient = new Redis(
// 	{
// 		host: "localhost",
// 		port: 6379,
// 		enableOfflineQueue: false,
// 	});

//rate limit client
//kubernetes cluster
// const redisClient = new Redis(
// 	{
// 		host: "redis-leader.default.svc.cluster.local",
// 		port: 6379,
// 		enableOfflineQueue: false,
// 	});


//gke
// const redisClient = new Redis(
// 	{
// 		host: "redis-cluster-redis-ha.default.svc.cluster.local",
// 		port: 6379,
// 		enableOfflineQueue: false,
// 	});

//get gke from env
const redisClient = new Redis(
	{
		host: redis_cluster_url,
		port: 6379,
		enableOfflineQueue: false,
	});

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	},
});


// docker redis
// const pubClient = new Redis(
// 	{
// 		host: "localhost",
// 		port: 6379,
// 		enableOfflineQueue: false,
// 		lazyConnect: true
// 	});

// kubernetes cluster
// const pubClient = new Redis(
// 	{
// 		host: "redis-leader.default.svc.cluster.local",
// 		port: 6379,
// 		enableOfflineQueue: false,
// 		lazyConnect: true
// 	}
// );

//gke
const pubClient = new Redis(
	{
		host: redis_cluster_url,
		port: 6379,
		enableOfflineQueue: false,
		lazyConnect: true
	}
);

const subClient = pubClient.duplicate();

subClient.on('connect', function () {
	console.log('redis connected')
	io.adapter(createAdapter(pubClient, subClient));
});


//rate limiter
// It is recommended to process Redis errors and setup some reconnection strategy
subClient.on('error', (err) => {
	console.log('unable to connect redis')
});


const opts = {
	// Basic options
	storeClient: redisClient,
	points: 5, // Number of points
	duration: 10, // Per second(s)

	//Custom
	execEvenly: false, // Do not delay actions evenly
	blockDuration: 30, // Do not block if consumed more than points
	keyPrefix: 'rlflx', // must be unique for limiters with different purpose
};


const rateLimiterRedis = new RateLimiterRedis(opts);
const PORT = 9000;
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_BID_EVENT = "newBid";
const END_AUCTION_EVENT = "endAuction";

const nsp = io.of("/auctionroom");

nsp.on("connection", (socket) => {
	console.log('new connection!');
	console.log(socket.handshake.query);
	// Join a conversation
	const roomId = socket.handshake.query['roomid'];
	const token = socket.handshake.query['token']
	const config = {
		headers: { Authorization: `${token}` }
	};

	//check if room exists
	axios.get(`${auctiondetailurl + roomId}`, config)
		.then(response => {
			console.log(response.data['owner_id']);
			const ownerid = response.data['owner_id']


			//check if room started or already ended
			let date = new Date();
			var start = new Date(response.data['start_time']);
			var end = new Date(response.data['end_time']);
			if ((start < date) && (end > date)) {
				console.log('room open');
				// Listen for new messages
				console.log(roomId)
				socket.join(roomId);
				socket.on(NEW_CHAT_MESSAGE_EVENT, async (data) => {
					rateLimiterRedis.consume(socket.handshake.address)
						.then((rateLimiterRes) => {
							// ... Some app logic here ...
							// console.log(rateLimiterRes);
							console.log(data);
							if (/\S/.test(data['body'])) {
								nsp.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
							}
						})
						.catch((rejRes) => {
							if (rejRes instanceof Error) {
								// Some Redis error
								// Never happen if `insuranceLimiter` set up
								// Decide what to do with it in other case
							} else {
								// Can't consume
								// If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
								const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
								socket.emit(NEW_CHAT_MESSAGE_EVENT, { body: "Please do not spam the chat!", username: '"Room Admin"' });
								// res.set('Retry-After', String(secs));
								// res.status(429).send('Too Many Requests');
							}
						});
				});

				// Listen for new bids
				socket.on(NEW_BID_EVENT, (data) => {
					console.log(data);
					axios.post(`${roomstorageurl}newbid`, data)
						.then(response => {
							console.log(response);
							nsp.in(roomId).emit(NEW_BID_EVENT, data);
						})
						.catch(function (error) {
							console.log(error);
						});


				});

				// Listen for auction end
				socket.on(END_AUCTION_EVENT, (data) => {
					console.log(data);
					//make api call to auctionroom server which will process the transaction
					//make call the auction details to indicate auction ended
					//make sure caller is the roomowner
					console.log(data.authtoken);
					const config = {
						headers: { Authorization: `${JSON.parse(data.authtoken)}` }
					};

					//check whether client is room owner, then show end auction button
					axios.get(`${auctiondetailurl + roomId}`, config)
						.then(response => {
							console.log(response.data['owner_id']);
							const auctiondata = response.data;
							const ownerid = response.data['owner_id']
							axios.get(
								`${authurl}`, config
							).then(authres => {
								console.log('authentication success');
								var authid = authres.data['userid']['_id']
								console.log(authres.data['userid']['_id'])
								if (authid == ownerid) {
									console.log('owner verified');
									console.log(authres.data['userid']);
									nsp.in(roomId).emit(END_AUCTION_EVENT, data);
									//end auction by setting end date to now
									auctiondata['end_time'] = date.toISOString();
									axios.patch(`${auctiondetailurl + roomId}`, auctiondata, config)
										.then(updateres => {
											console.log('update success');
										})
										.catch(function (error) {
											console.log("Update endtime failed");
										});
									//TODO
									//call end auction api in auction room
									axios.delete(`${roomstorageurl}deleteroom/${roomId}`, data)
										.then(response => {
											console.log('Room deleted and transaction made');
										})
										.catch(function (error) {
											console.log("Transaction failed");
										});
								}
							})
								.catch(function (error) {
									console.log("End auction failed");
									// console.log(error);
								});
						})
						.catch(function (error) {
							// console.log(error);
						});

				});

				//
				// Leave the room if the user closes the socket
				socket.on("disconnect", () => {
					socket.leave(roomId);
				});
			} else {
				console.log('Auction has ended')
			}



		})
		.catch(function (error) {
			// console.log(error);
			console.log("Room does not exist!");
		});

});

server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});



