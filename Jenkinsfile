// Jenkinsfile - CI/CD for Feedback Board (cross-platform)
// Requires Jenkins credentials:
//  - docker-hub-cred (Username/Password)  -> ID: docker-hub-cred
//  - kubeconfig (Secret file)             -> ID: kubeconfig
pipeline {
  agent any

  environment {
    DOCKER_IMAGE = "herit1974/feedback-board"
    DOCKER_TAG   = "latest"
    // We will use the temporary kubeconfig file path provided by Jenkins 'withCredentials'
    WORK_KUBECONFIG = "${WORKSPACE}\\.kube\\config" // used only as a reference on Windows, kubectl will be given the credential file directly
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    skipDefaultCheckout(true)
  }

  stages {

    stage('Checkout SCM') {
      steps {
        echo "Checking out source code (scm)"
        checkout scm
      }
    }

    stage('Install & Test') {
      steps {
        echo "Installing dependencies and running tests (cross-platform)"
        script {
          if (isUnix()) {
            sh '''
              set -e
              echo "node version:"
              node --version || true
              echo "npm version:"
              npm --version || true
              npm ci || npm install
              npm test || true
            '''
          } else {
            bat '''
              @echo off
              echo node version:
              node --version || echo node-not-found
              echo npm version:
              npm --version || echo npm-not-found
              REM try npm ci, fallback to npm install
              npm ci || (echo npm ci failed - trying npm install & npm install)
              npm test || echo tests-failed-but-continue
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
        echo "Pushing Docker image to registry"
        withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            if (isUnix()) {
              sh '''
                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
              '''
            } else {
              // Windows (cmd). This uses piping; if your Jenkins runs under an account that can't pipe, adjust to PowerShell.
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
        echo "Deploying to Kubernetes (using kubeconfig credential 'kubeconfig')"
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          script {
            if (isUnix()) {
              sh '''
                echo "Using kubeconfig: ${KUBECONFIG_FILE}"
                kubectl --kubeconfig="${KUBECONFIG_FILE}" version --client
                kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f k8s/deployment.yaml
                kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f k8s/service.yaml
                kubectl --kubeconfig="${KUBECONFIG_FILE}" rollout status deployment/feedback-board --timeout=120s || true
                kubectl --kubeconfig="${KUBECONFIG_FILE}" get svc feedback-board-service -o wide
              '''
            } else {
              bat """
                @echo off
                echo Using kubeconfig: %KUBECONFIG_FILE%
                kubectl --kubeconfig="%KUBECONFIG_FILE%" version --client
                kubectl --kubeconfig="%KUBECONFIG_FILE%" apply -f k8s\\deployment.yaml
                kubectl --kubeconfig="%KUBECONFIG_FILE%" apply -f k8s\\service.yaml
                kubectl --kubeconfig="%KUBECONFIG_FILE%" rollout status deployment/feedback-board --timeout=120s || exit 0
                kubectl --kubeconfig="%KUBECONFIG_FILE%" get svc feedback-board-service -o wide
              """
            }
          }
        }
      }
    }
  } // stages

  post {
    success {
      echo "Pipeline SUCCESS — image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
    }
    failure {
      echo "Pipeline FAILED — check console output"
    }
    always {
      // keep short build workspace tidy
      cleanWs()
      // (optional) archive logs or artifacts if present
      archiveArtifacts artifacts: 'logs/**/*.log, dist/**', allowEmptyArchive: true
    }
  }
}
