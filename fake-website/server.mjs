import { createServer } from 'node:http'
import serve from 'serve-handler'
import { join } from 'node:path'
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const startServer = async (bindAddress) => {
  const server = createServer((request, response) => {
    return serve(request, response, {
      public: join(__dirname, '../fake-website/public'),
      rewrites: [{ source: '/', destination: '/index.html' }],
      etag: true,
    })
  })

  const hostname = bindAddress.split(':')[0]
  const port = Number(bindAddress.split(':')[1])

  await new Promise((resolve) => {
    server.listen(port, hostname, () => {
      resolve(() => server.close())
    })
  })
}

startServer(process.argv[2]).catch((error) => {
  console.error(error)
  process.exit(1)
})
