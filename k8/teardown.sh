#!/bin/bash 
# ./k8/teardown.sh
# kubectl delete -f ./k8/services/1-frontend.yaml;
# kubectl delete -f ./k8/services/2-mongodb.yaml; 
kubectl delete -f ./k8/services/3-useraccount.yaml; 
kubectl delete -f ./k8/services/4-auctionroommanager.yaml; 
kubectl delete -f ./k8/services/5-auctiondetails.yaml;
kubectl delete -f ./k8/services/6-currencymanagement.yaml
kubectl delete -f ./k8/services/7-redis.yaml;
kubectl apply -f ./k8/services/7-redis-cluster.yaml ;
kubectl delete -f ./k8/services/9-auctionroom.yaml
kubectl delete -f ./k8/ingress/unauth-ingress.yaml ;
kubectl delete -f ./k8/ingress/auth-ingress.yaml ;
kubectl delete -f ./k8/ingress/chat-ingress.yaml ;
docker stop auctiondocker;