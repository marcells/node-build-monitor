|       Parameter                        |           Description                       |                         Default                     |
|----------------------------------------|---------------------------------------------|-----------------------------------------------------|
| `image.pullPolicy`                     | Container pull policy                       | `IfNotPresent`                                      |
| `image.repository`                     | Container image to use                      | `marcells/node-build-monitor`                           |
| `image.tag`                            | Container image tag to deploy               | `latest`                                            |
| `replicaCount`                         | k8s replicas                                | `1`                                                 |
| `resources`                            | Container resource                          | `{}`                                                |
| `nodeSelector`                         | Map of node labels for pod assignment       | `{}`                                                |
| `tolerations`                          | List of node taints to tolerate             | `[]`                                                |
| `affinity`                             | Map of node/pod affinities                  | `{}`                                                |
| `ingress.enabled`                      | Enable ingress                              | `false`                                             |
| `ingress.annotations`                  | Ingress annotations                         | `{}`                                                |
| `ingress.hosts`                        | Ingress Hostnames                           | `["build-monitor.local"]`                           |
| `ingress.path`                         | Path within the URL structure               | `/`                                                 |
| `ingress.tls`                          | Ingress TLS configuration                   | `[]`                                                |
| `service.type`                         | Kubernetes Service type                     | `ClusterIP`                                         |
| `service.port`                         | Port                                        | `80`                                                |
| `config`                               | Json config for node-build-monitor          | `{}`                                                |
| `port`                                 | Port of application                         | `3000`                                              |
| `rejectTls`                            | reject tls envirnment var                   | `1`                                                 |
