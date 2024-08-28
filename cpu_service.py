from flask import Flask, request, jsonify
import numpy as np
from Triqui import Triqui

juego = Triqui()  # si se desea iniciar un juego nuevo hay que reiniciar el servidor
app = Flask(__name__)


def minimax_search(juego, estado):
    pass
    value, move = min_value(juego, estado)
    return move


def max_value(juego, estado):
    pass
    player = juego.player(estado)
    if juego.es_terminal(estado):
        return juego.utilidad(estado, player), None
    v = float("-inf")
    for a in juego.acciones(estado):
        v2, a2 = min_value(juego, juego.resultado(estado, a))
        if v2 > v:
            v, move = v2, a
    return v, move


def min_value(juego, estado):
    pass
    player = juego.player(estado)
    if juego.es_terminal(estado):
        return juego.utilidad(estado, player), None
    v = float("inf")
    for a in juego.acciones(estado):
        v2, a2 = max_value(juego, juego.resultado(estado, a))
        if v2 < v:
            v, move = v2, a
    return v, move


@app.route("/agente", methods=["POST"])
def get_agent_move():
    data = request.json
    estado = data["estado"]
    estado = np.array(estado).reshape(3, 3)
    estado[estado == "x"] = 2
    estado[estado == "o"] = 1
    estado[estado == ""] = 0
    estado = np.array(estado, dtype=int)
    print(estado)
    accion = minimax_search(juego, estado)
    print(juego.resultado(estado, accion), accion)

    return jsonify({"move": accion[1] * 3 + accion[0]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
