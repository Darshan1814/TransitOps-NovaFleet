pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPOSITORY = 'novafleet-app'
        IMAGE_TAG = "${env.BUILD_ID}"
        KUBECONFIG = credentials('kubeconfig-credentials')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh 'npm install'
                // sh 'npm test' // Uncomment when tests are added
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push to AWS ECR') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                    dockerImage.push()
                    dockerImage.push('latest')
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Update deployment manifest with the new image tag
                    sh "sed -i 's|IMAGE_TAG_PLACEHOLDER|${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}|g' kubernetes/deployment.yaml"
                    
                    // Apply manifests
                    sh "kubectl apply -f kubernetes/namespace.yaml"
                    sh "kubectl apply -f kubernetes/deployment.yaml"
                    sh "kubectl apply -f kubernetes/service.yaml"
                    sh "kubectl apply -f kubernetes/hpa.yaml"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! NovaFleet deployed to Staging."
        }
        failure {
            echo "Pipeline failed. Check the logs."
        }
    }
}
