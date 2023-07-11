### Starting Minikube 

`minikube start --kubernetes-version v1.25.7 -p agones`

### Installing Agones

`kubectl create namespace agones-system`
`kubectl apply --server-side -f https://raw.githubusercontent.com/googleforgames/agones/release-1.33.0/install/yaml/install.yaml`
