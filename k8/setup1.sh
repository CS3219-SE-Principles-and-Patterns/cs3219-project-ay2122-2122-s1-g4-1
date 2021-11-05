#!/bin/bash
# run using ./k8/setup1.sh
# run this if nginx ingress not configured
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.0.4/deploy/static/provider/cloud/deploy.yaml;
kubectl apply -f ./k8/services/2-mongodb.yaml; 
# redis server needs to start before auctionroom
# kubectl apply -f ./k8/services/7-redis.yaml ;
kubectl apply -f ./k8/services/7-redis-cluster.yaml ;
kubectl apply -f ./k8/services/3-useraccount.yaml; 
kubectl apply -f ./k8/services/5-auctiondetails.yaml;
kubectl apply -f ./k8/ingress/unauth-ingress.yaml ;
kubectl apply -f ./k8/ingress/auth-ingress.yaml ;
kubectl apply -f ./k8/ingress/chat-ingress.yaml ;
kubectl apply -f ./k8/services/6-currencymanagement.yaml
kubectl apply -f ./k8/services/9-auctionroom.yaml
# run this if frontend container has not been built(if the first time running this script)
docker rm auctiondocker
docker run -d --publish 8080:3000 --name auctiondocker -i  -t auctionfrontend:latest  
# docker container start auctiondocker
# wait for redis to start first
sleep 5s
kubectl apply -f ./k8/services/4-auctionroommanager.yaml; 
