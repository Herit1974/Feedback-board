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
    skipDefaultCheckout(true)
  }

  stages {
    stage('Checkout SCM') {
      steps {
        echo "Checking out source code"
        checkout scm
      }
    }

    stage('Install & Test') {
      steps {
        echo "Installing dependencies and running tests (cross-platform)"
        script {
          if (isUnix()) {
            // Unix-friendly
            sh '''
              set -e
              echo "node version:"
              node --version || true
              echo "npm version:"
              npm --version || true
              npm install
              npm test
            '''
          } else {
            // Windows-friendly (uses cmd / PowerShell via bat)
            bat '''
              @echo off
              echo node version:
              node --version || echo node-not-found
              echo npm version:
              npm --version || echo npm-not-found
              REM use npm install, may require Node installed on the agent
              npm install
              npm test
            '''
          }
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        echo "Building Docker image ${env.DOCKER_IMAGE}:${env.DOCKER_TAG}"
        script {
          if (isUnix()) {
            sh "docker build -t ${env.DOCKER_IMAGE}:${env.DOCKER_TAG} ."
          } else {
            bat "docker build -t ${env.DOCKER_IMAGE}:${env.DOCKER_TAG} ."
          }
        }
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            if (isUnix()) {
              sh '''
                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
              '''
            } else {
              bat """
                @echo off
                echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
              """
            }
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        echo "Deploying to Kubernetes (requires kubeconfig credential 'kubeconfig')"
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          script {
            // Copy kubeconfig into workspace and use kubectl via minikube kubectl or installed kubectl
            if (isUnix()) {
              sh '''
                mkdir -p $(dirname "${KUBECONFIG}")
                cp "${KUBECONFIG_FILE}" "${KUBECONFIG}"
                kubectl apply -f k8s/deployment.yaml
                kubectl apply -f k8s/service.yaml
              '''
            } else {
              bat """
                @echo off
                if not exist "%WORKSPACE%\\.kube" mkdir "%WORKSPACE%\\.kube"
                copy "%KUBECONFIG_FILE%" "%KUBECONFIG%"
                kubectl apply -f k8s\\deployment.yaml
                kubectl apply -f k8s\\service.yaml
              """
            }
          }
        }
      }
    }
  }

  post {
    success {
      echo "Pipeline SUCCESS"
    }
    failure {
      echo "Pipeline failed - check console output"
    }
    always {
      cleanWs()
    }
  }
}
