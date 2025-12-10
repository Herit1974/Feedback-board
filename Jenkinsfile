pipeline {
  agent any

  environment {
    DOCKER_IMAGE = "herit1974/feedback-board"
    DOCKER_TAG   = "latest"
    KUBECONFIG   = "${WORKSPACE}/.kube/config"
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {

    stage('Checkout') {
      steps {
        echo "Checking out source code"
        checkout scm
      }
    }

    stage('Install & Test') {
      steps {
        echo "Installing dependencies and running tests"
        sh '''
          set -e
          npm install
          npm test
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        echo "Building Docker image ${env.DOCKER_IMAGE}:${env.DOCKER_TAG}"
        sh """
          docker build -t ${env.DOCKER_IMAGE}:${env.DOCKER_TAG} .
        """
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-cred',
                                          usernameVariable: 'DOCKER_USER',
                                          passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push '"${DOCKER_IMAGE}:${DOCKER_TAG}"'
          '''.stripIndent()
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        echo "Deploying to Kubernetes"
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh '''
            mkdir -p $(dirname "$KUBECONFIG")
            cp "$KUBECONFIG_FILE" "$KUBECONFIG"
            kubectl version --client
            kubectl apply -f k8s/deployment.yaml
            kubectl apply -f k8s/service.yaml
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Deployment successful"
    }
    failure {
      echo "Pipeline failed - check console output"
    }
  }
}
