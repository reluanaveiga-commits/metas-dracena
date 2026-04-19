/* ================== RESET ================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Segoe UI", Arial, sans-serif;
}

/* ================== VARIÁVEIS ================== */
:root {
    --verde: #2ecc71;
    --verde-escuro: #27ae60;
    --verde-soft: #e9f9ef;

    --cinza-bg: #f4f6f9;
    --cinza-card: #ffffff;
    --texto: #2c3e50;
}

/* ================== BODY ================== */
body {
    background: var(--cinza-bg);
    color: var(--texto);
}

/* ================== HEADER (MENOR E MAIS MODERNO) ================== */
.topo {
    background: linear-gradient(135deg, var(--verde), var(--verde-escuro));
    color: white;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
}

.brand h1 {
    font-size: 16px;
    line-height: 1.2;
    margin: 0;
}

.brand span {
    font-size: 11px;
    opacity: 0.85;
}

/* ================== CONTAINER ================== */
.container {
    padding: 20px;
}

/* ================== GRID ================== */
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
}

/* ================== CARD ================== */
.card {
    background: var(--cinza-card);
    padding: 18px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transition: 0.2s;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card h3 {
    margin-bottom: 10px;
    color: var(--verde-escuro);
}

/* ================== INPUTS ================== */
input,
select {
    width: 100%;
    padding: 10px;
    margin: 6px 0 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    transition: 0.2s;
}

input:focus,
select:focus {
    border-color: var(--verde);
    box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.15);
}

/* ================== BOTÕES GERAL ================== */
button {
    width: 100%;
    padding: 10px;
    background: var(--verde);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;
}

button:hover {
    background: var(--verde-escuro);
    transform: scale(1.02);
}

/* ================== BOTÕES EM GRUPO ================== */
.button-row {
    display: flex;
    gap: 12px;
    margin-top: 8px;
}

.button-row button {
    flex: 1;
    width: auto;
}

/* ================== FUNCIONÁRIAS ================== */
.funcionario {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.funcionario input {
    flex: 1;
}

.funcionario button {
    width: auto;
    padding: 8px 10px;
}

/* ================== CHECKBOX ================== */
.check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

/* ================== TABELA ================== */
table {
    margin-top: 10px;
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 10px;
    overflow: hidden;
}

th {
    background: var(--verde-escuro);
    color: white;
    padding: 8px;
}

td {
    border-bottom: 1px solid #eee;
    padding: 6px;
    text-align: center;
}

tr:hover td {
    background: var(--verde-soft);
}

/* ================== EXPORT CARD ================== */
.small {
    max-width: 320px;
    justify-self: end;
    padding: 20px;
}

.small h3 {
    margin-bottom: 12px;
}

/* ================== FULL WIDTH ================== */
.full {
    grid-column: 1 / -1;
}

/* ================== SCROLL TABELA ================== */
#dias {
    overflow-x: auto;
    background: white !important;
    min-height: 100px;
    display: block !important;
}

#dias table {
    border-collapse: collapse;
    width: 100%;
    background-color: white !important;
}

/* ================== CORES ESPECIAIS ================== */
.domingo {
    background: #fff3f3 !important;
}

.feriado {
    background: #ffe6e6 !important;
}

#dias td,
#dias th {
    color: black !important;
    border: 1px solid #ccc !important;
    padding: 8px;
}

/* ================== LOGIN ================== */
/* ================== FUNDO DA TELA ================== */
.login {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ================== CARD DE LOGIN ================== */
/* ================== FUNDO ================== */
.login {
    position: fixed;
    inset: 0;
    background: #f4f6f9;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ================== QUADRO CENTRAL ================== */
.login-box {
    width: 320px;
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

/* TÍTULO */
.login-box h2 {
    text-align: center;
    margin-bottom: 18px;
    color: #27ae60;
    font-size: 20px;
}

/* INPUTS */
.login-box input {
    width: 100%;
    padding: 10px;
    margin: 8px 0;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
}

/* BOTÃO */
.login-box button {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    background: #2ecc71;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    cursor: pointer;
}

.login-box button:hover {
    background: #27ae60;
}

/* ERRO */
#erro {
    margin-top: 10px;
    font-size: 13px;
    color: red;
    text-align: center;
}

/* ================== APP ================== */
#app {
    display: none;
}
