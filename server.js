const index = require("fs").readFileSync(__dirname + "/client/index.html", "utf8")
const play = require("fs").readFileSync(__dirname + "/client/play.html", "utf8")
const style = require("fs").readFileSync(__dirname + "/client/style.css", "utf8")
const script = require("fs").readFileSync(__dirname + "/client/script.js", "utf8")

const httpServer = require("http").createServer((req, res) => {
  if (req.url == "/") {
    res.setHeader("Content-Type", "text/html")
    res.setHeader("Content-Length", Buffer.byteLength(index))
    res.end(index)
  } else if (req.url == "/play" || req.url == "/play?cpu=true") {
    res.setHeader("Content-Type", "text/html")
    res.setHeader("Content-Length", Buffer.byteLength(play))
    res.end(play)
  } else if (req.url == "/style.css") {
    res.setHeader("Content-Type", "text/css")
    res.setHeader("Content-Length", Buffer.byteLength(style))
    res.end(style)
  } else if (req.url == "/script.js") {
    res.setHeader("Content-Type", "text/javascript")
    res.setHeader("Content-Length", Buffer.byteLength(script))
    res.end(script)
  } else {
    res.writeHead(404)
  }
})

const axios = require("axios")

async function cpuMove(rival_socket, mark, board) {
  try {
    const response = await axios.post("http://localhost:5000/agente", {
      estado: board,
    })
    const action = response.data.move
    return action
  } catch (error) {
    console.error("Error al obtener el movimiento de la máquina:", error)
  }
}

const io = require("socket.io")(httpServer)
let players = { x: null, o: null }

io.on("connection", socket => {
  const urlParams = new URL(socket.handshake.headers.referer).searchParams
  const cpuMode = urlParams.has("cpu")

  board = Array(9).fill("")

  if (cpuMode) {
    socket.emit("mark-assign", "x")
    players.x = socket.id
    players.o = "cpu"
    console.log("X assigned to socket " + socket.id + " (playing against CPU)")
    socket.emit("start", "cpu")
  } else {
    if (players.x === null) {
      socket.emit("mark-assign", "x")
      players.x = socket.id
      console.log("X assigned to socket " + socket.id)
    } else if (players.o === null) {
      socket.emit("mark-assign", "o")
      players.o = socket.id
      console.log("O assigned to socket " + socket.id)
      // despues de que ambos se unan puede empezar
      io.to(players.x).emit("start", players.o)
      io.to(players.o).emit("start", players.x)
    } else {
      socket.emit("full-room")
    }
  }

  socket.on("rival-movement", async ({ to, id }) => {
    if (to === "cpu") {
      const mark = "o"
      board[id.slice(-1)] = "x"
      const action = await cpuMove(socket, mark, board)
      board[action] = mark

      const cellId = `cell-${action}`
      io.to(players.x).emit("rival-movement", cellId)
    } else {
      socket.to(to).emit("rival-movement", id)
    }
  })

  socket.on("game-end", state => {
    io.to(players.x).emit("game-end", state)
    if (!cpuMode) {
      io.to(players.o).emit("game-end", state)
    }
  })
})

httpServer.listen(3000, () => {
  console.log("running on http://localhost:3000")
})
