FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-12

ENV DEBIAN_FRONTEND=noninteractive

# RUN apt-get update \
#    && apt-get -y install --no-install-recommends <your-package-list-here> \
#    #
#    # Clean up
#    && apt-get autoremove -y \
#    && apt-get clean -y \
#    && rm -rf /var/lib/apt/lists/*

RUN npm install -g grunt-cli

ENV DEBIAN_FRONTEND=dialog

