workflow "Build and Push" {
  on = "push"
  resolves = ["Log in to Docker registry", "Push image to Docker registry"]
}

action "Build Docker image" {
  uses = "actions/docker/cli@8cdf801b322af5f369e00d85e9cf3a7122f49108"
  args = ["build", "-t", "raincal/safari-pdf", "."]
}

action "Push image to Docker registry" {
  uses = "actions/docker/cli@8cdf801b322af5f369e00d85e9cf3a7122f49108"
  needs = ["Build Docker image"]
  args = ["push", "raincal/safari-pdf"]
}

action "Log in to Docker registry" {
  uses = "actions/docker/login@8cdf801b322af5f369e00d85e9cf3a7122f49108"
  secrets = ["DOCKER_USERNAME", "DOCKER_PASSWORD"]
}
