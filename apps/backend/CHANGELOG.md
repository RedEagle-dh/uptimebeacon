## [1.2.1](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.2.0...backend-v1.2.1) (2025-12-08)


### Bug Fixes

* frontend build fails because of db calls fix: Adding missing db ([d322f57](https://github.com/RedEagle-dh/uptimebeacon/commit/d322f573da1093d3526acd5caf1bff55c2b84a06))

# [1.2.0](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.1.3...backend-v1.2.0) (2025-12-08)


### Bug Fixes

* adding /api/health endpoint on the frontend ([f62815c](https://github.com/RedEagle-dh/uptimebeacon/commit/f62815cea8ffc9489e55780e424c9b3e386876f7))
* get-site-settings.ts retrieving DATABASE_URL during build ([5e7d105](https://github.com/RedEagle-dh/uptimebeacon/commit/5e7d105d2f999dba358c6c982d64c9a301558447))
* making prepare script optional for docker environments where git ([ac62ff1](https://github.com/RedEagle-dh/uptimebeacon/commit/ac62ff13c334587ffc237a5512f1435edb0e3521))


### Features

* add notifications, status pages, incidents, and monitor management ([46eac78](https://github.com/RedEagle-dh/uptimebeacon/commit/46eac7816c1e459d30982ffa6b5851db2d2839de))
* adding timeout minutes on build workflow ([2a2bd6e](https://github.com/RedEagle-dh/uptimebeacon/commit/2a2bd6e3894733a741845dda24ecc357f30bfa60))

# [1.2.0-beta.1](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.1.3...backend-v1.2.0-beta.1) (2025-12-07)


### Bug Fixes

* adding /api/health endpoint on the frontend ([f62815c](https://github.com/RedEagle-dh/uptimebeacon/commit/f62815cea8ffc9489e55780e424c9b3e386876f7))
* get-site-settings.ts retrieving DATABASE_URL during build ([5e7d105](https://github.com/RedEagle-dh/uptimebeacon/commit/5e7d105d2f999dba358c6c982d64c9a301558447))
* making prepare script optional for docker environments where git ([ac62ff1](https://github.com/RedEagle-dh/uptimebeacon/commit/ac62ff13c334587ffc237a5512f1435edb0e3521))


### Features

* add design pattern docs, fix UI inconsistencies, performance and ([136032f](https://github.com/RedEagle-dh/uptimebeacon/commit/136032f79f41209e0e5b45dd9aeb0b12160a6b4e))
* adding timeout minutes on build workflow ([2a2bd6e](https://github.com/RedEagle-dh/uptimebeacon/commit/2a2bd6e3894733a741845dda24ecc357f30bfa60))

## [1.1.3](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.1.2...backend-v1.1.3) (2025-12-05)


### Bug Fixes

* Dockerfile builds frontend and backend ([eafd3a7](https://github.com/RedEagle-dh/uptimebeacon/commit/eafd3a7993e0cf47dca767353f981ef9e07d3817))

## [1.1.1](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.1.0...backend-v1.1.1) (2025-12-05)


### Bug Fixes

* copying the full bun.lock instead of the pruned one because of a semantic-release issue ([774aff1](https://github.com/RedEagle-dh/uptimebeacon/commit/774aff157e1f10e49f59844ced27cc078e264c7c))

# [1.1.0](https://github.com/RedEagle-dh/uptimebeacon/compare/backend-v1.0.0...backend-v1.1.0) (2025-12-05)


### Features

* merging single workflows into one ci-cd workflow ([18c8310](https://github.com/RedEagle-dh/uptimebeacon/commit/18c83109d89f2669f61c0f1227ba15c4b310a36e))

# 1.0.0 (2025-12-05)


### Bug Fixes

* add SKIP_ENV_VALIDATION environment variable for frontend build ([81361af](https://github.com/RedEagle-dh/uptimebeacon/commit/81361afc9ea60a748f406dc37b7a95d09cb0fd8b))
* Adding pg and prisma client deps to backend and frontend. Fixing Hydration error on landing page. Fixing prisma.config.ts ([4046a04](https://github.com/RedEagle-dh/uptimebeacon/commit/4046a047e9722a60cb0e1539bd1d3e2311f04bdb))
* correct node_modules path in .gitignore ([d375e55](https://github.com/RedEagle-dh/uptimebeacon/commit/d375e551c1a1d99684cbcd7245cc39bdfa2b4ee9))
* deploy workflow depending on release workflow ([800aea9](https://github.com/RedEagle-dh/uptimebeacon/commit/800aea943ceb5976896ae5fd907b0037ed456b52))
* Improved size of docker images, updating react and nextjs ([39c6bf8](https://github.com/RedEagle-dh/uptimebeacon/commit/39c6bf8b0aaf0493b0862f97d605aa20ee50d93b))
* making db client lazy ([7bd3ce3](https://github.com/RedEagle-dh/uptimebeacon/commit/7bd3ce377444fdc2df0151d971dceccd50c56b8f))
* refactor GitHub Actions workflow for multi-architecture frontend and backend builds ([b1c44fd](https://github.com/RedEagle-dh/uptimebeacon/commit/b1c44fd4f7a8b7dffd79127f7fa501e45750cb19))
* refactor image name handling in GitHub Actions workflow for frontend and backend ([6eddcc9](https://github.com/RedEagle-dh/uptimebeacon/commit/6eddcc91756135a7e83effc1ec2266ccd1af0a06))
* update Bun version to 1.3.3 in backend and frontend Dockerfiles ([f3bd6cb](https://github.com/RedEagle-dh/uptimebeacon/commit/f3bd6cbea0615bc1201bad267d67830a38e23dc1))
* update Bun version to 1.3.3 in CI workflow ([2f8e0db](https://github.com/RedEagle-dh/uptimebeacon/commit/2f8e0db79642fbbd20ebb7d7e3b10707673366ab))
* updating bun package manager to v 1.3.3 and running linter ([6abb13f](https://github.com/RedEagle-dh/uptimebeacon/commit/6abb13fc1d9170b5dcae943eff76d6cadc3021f3))
* Updating bun.lock ([c4a7c53](https://github.com/RedEagle-dh/uptimebeacon/commit/c4a7c53d3b8d92e0611dfb8cc36b44042fbe7a10))


### Features

* Add comprehensive documentation for UptimeBeacon setup and usage ([adcfb2e](https://github.com/RedEagle-dh/uptimebeacon/commit/adcfb2ebbacb98102b073573aca1d985fce85aee))
* add version management and update checker ([e736a26](https://github.com/RedEagle-dh/uptimebeacon/commit/e736a26b3e5d2fd188a1c424a9db4c764b02f1f9))
* Adding automatic database migration ([f4a52f8](https://github.com/RedEagle-dh/uptimebeacon/commit/f4a52f835e06295532835f647cede8275507b1e1))
