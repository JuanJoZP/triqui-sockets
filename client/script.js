const cells = document.querySelectorAll("[data-cell]")
let mark
let rival_socket
let rival_mark
let myturn
let board = Array(9).fill(null)

const socket = io()

socket.on("connect", () => {
  console.log("connected to server")
})

socket.on("full-room", () => {
  document.getElementById("loading-message").innerText =
    "La sala esta llena, por favor espera, recarga la pagina para vover a intentar."
})

socket.on("mark-assign", t => {
  mark = t
})

socket.on("start", rivalId => {
  rival_socket = rivalId
  console.log(mark + " rival socket is " + rival_socket)

  if (mark == "x") {
    rival_mark = "o"
    myturn = true
  } else {
    rival_mark = "x"
    myturn = false
  }
  startGame()
})

socket.on("rival-movement", id => {
  document.getElementById(id).classList.add(rival_mark)
  myturn = true
  board[id.slice(-1)] = rival_mark

  state = getGameStatus()
  if (state !== null) {
    socket.emit("game-end", state)
  }
})

socket.on("game-end", state => {
  document.getElementById("overlay").style.display = "flex"
  document.getElementById("loading-message").innerText = state
})

function startGame() {
  document.getElementById("spinner").style.display = "none"
  document.getElementById("overlay").style.display = "none"
  cells.forEach((cell, i) => {
    cell.onclick = handleClick
    cell.id = "cell-" + i
  })
}

function handleClick(e) {
  if (myturn) {
    const cell = e.target
    cell.classList.add(mark)
    socket.emit("rival-movement", { to: rival_socket, id: cell.id })
    myturn = false
    board[cell.id.slice(-1)] = mark

    state = getGameStatus()
    if (state !== null) {
      socket.emit("game-end", state)
    }
  }
}

function checkWin(player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  return winPatterns.some(pattern => pattern.every(index => board[index] === player))
}

function checkDraw() {
  return board.every(cell => cell !== null)
}

function getGameStatus() {
  if (checkWin("x")) return "Ganan las X"
  if (checkWin("o")) return "Ganan las O"
  if (checkDraw()) return "Empate"
  return null
}
