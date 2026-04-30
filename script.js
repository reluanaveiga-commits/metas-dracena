// ================== VARIÁVEIS ==================
let funcionarias = [];
let vendasPorDia = {};
let percentualGlobal = 0;

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ================== FERIADOS ==================
const feriados = [
    "01/01", "03/04", "21/04", "01/05", "07/09",
    "12/10", "02/11", "15/11", "25/12"
];

function isFeriado(data) {
    let dia = String(data.getDate()).padStart(2, "0");
    let mes = String(data.getMonth() + 1).padStart(2, "0");
    return feriados.includes(`${dia}/${mes}`);
}

// ================== FUNCIONÁRIAS POR CIDADE ==================
const funcionariosPorCidade = {
    "Ikeda": ["Franciele", "Andressa", "Nicole"],
    "Dracena": ["Suelen", "Nicolie", "Carmem"],
    "Junqueirópolis": ["Giovana", "Stefany", "Mariana"],
    "Tupi Paulista": ["Mariana", "Bruna", "Jheniffer"],
    "Panorama": ["Camila", "Jaqueline"],
    "Paulicéia": ["Mariele", "Myllena"]
};

// ================== FORMATAÇÃO ==================
function formatarReal(valor) {
    if (isNaN(valor)) valor = 0;
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function converterValor(valor) {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return valor;

    let str = valor.toString()
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    let n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}

// ================== CIDADE ==================
window.addEventListener("load", () => {
    const cidade = document.getElementById("cidade");

    cidade?.addEventListener("change", (e) => {
        carregarFuncionarias(e.target.value);
    });
});

function carregarFuncionarias(cidade) {
    const container = document.getElementById("listaFuncionarias");
    if (!container) return;

    container.innerHTML = "";

    const lista = funcionariosPorCidade[cidade];
    if (!Array.isArray(lista)) return;

    lista.forEach(nome => {
        const div = document.createElement("div");
        div.classList.add("funcionario");
        div.innerHTML = `
            <input type="text" value="${nome}">
            <button onclick="this.parentElement.remove(); pegarFuncionarias();">Remover</button>
        `;
        container.appendChild(div);
    });

    pegarFuncionarias();
}

function pegarFuncionarias() {
    let inputs = document.querySelectorAll("#listaFuncionarias input");
    funcionarias = [];

    inputs.forEach(i => {
        if (i.value.trim()) funcionarias.push(i.value.trim());
    });

    atualizarFiltro();
}

function atualizarFiltro() {
    let select = document.getElementById("filtro");
    if (!select) return;

    select.innerHTML = `<option value="todas">Todas</option>`;

    funcionarias.forEach(n => {
        let opt = document.createElement("option");
        opt.value = n;
        opt.textContent = n;
        select.appendChild(opt);
    });
}

// ================== PLANILHA ==================
function lerPlanilha() {
    const file = document.getElementById("inputExcel").files[0];
    if (!file) return alert("Selecione a planilha!");

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const nomeAba = workbook.SheetNames.find(n =>
            n.toLowerCase().trim() === "dia"
        );

        if (!nomeAba) return alert("Aba DIA não encontrada!");

        const aba = workbook.Sheets[nomeAba];
        const linhas = XLSX.utils.sheet_to_json(aba, { header: 1 });

        vendasPorDia = {};
        let totalAcumulado = 0;

        for (let i = 1; i < linhas.length; i++) {
            let linha = linhas[i];
            if (!linha || !linha[0]) continue;

            let texto = linha[0].toString().trim();
            if (!texto) continue;
            if (texto.toLowerCase().includes("total")) continue;

            texto = texto.replace(/\//g, " ").replace(/\s+/g, " ").trim();

            let partes = texto.split(" ");
            if (partes.length < 3) continue;

            let dia = partes[0].padStart(2, "0");
            let mes = partes[1].charAt(0).toUpperCase() + partes[1].slice(1).toLowerCase();
            let ano = partes[2];

            let dataStr = `${dia} ${mes} ${ano}`;

            let valor = converterValor(linha[1]);
            vendasPorDia[dataStr] = valor;

            totalAcumulado += valor;
        }

        document.getElementById("anoPassado").value = totalAcumulado.toFixed(2);
        alert("Planilha carregada com sucesso!");
    };

    reader.readAsArrayBuffer(file);
}

// ================== CÁLCULO ==================
function calcularMeta() {
    let anoPassado = parseFloat(document.getElementById("anoPassado").value || 0);
    let percentual = parseFloat(document.getElementById("percentual").value || 0);

    percentualGlobal = percentual;

    let meta = anoPassado * (1 + percentual / 100);

    document.getElementById("metaResultado").innerText =
        "Meta mensal: " + formatarReal(meta);

    gerarCalendario();
}

// ================== CALENDÁRIO ==================
function gerarCalendario() {
    pegarFuncionarias();

    let container = document.getElementById("dias");
    container.innerHTML = "";

    let mes = parseInt(document.getElementById("mesSelecionado").value);
    let ano = parseInt(document.getElementById("anoSelecionado").value);

    let diasNoMes = new Date(ano, mes + 1, 0).getDate();

    let anoPassado = parseFloat(document.getElementById("anoPassado").value || 0);
    let metaMensal = anoPassado * (1 + percentualGlobal / 100);

    let valoresValidos = Object.values(vendasPorDia).filter(v => v > 0);
    let mediaReal = valoresValidos.length
        ? valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length
        : 0;

    let metasBase = {};
    let soma = 0;

    for (let i = 1; i <= diasNoMes; i++) {
        let valor = mediaReal * (1 + percentualGlobal / 100);

        metasBase[i] = valor;
        soma += valor;
    }

    let fator = soma ? metaMensal / soma : 1;

    let tabela = document.createElement("table");
    tabela.style.width = "100%";
    tabela.border = "1";

    tabela.innerHTML = `
        <tr>
            <th>Data</th>
            <th>Dia</th>
            <th>Funcionária</th>
            <th>Ativo</th>
            <th>Meta Individual</th>
            <th>Meta Loja</th>
        </tr>
    `;

    let totalIndiv = 0;
    let totalLoja = 0;

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);
        let valorLoja = metasBase[i] * fator;

        funcionarias.forEach(nome => {
            let tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${String(i).padStart(2, "0")}/${mes + 1}/${ano}</td>
                <td>${data.getDay()}</td>
                <td class="func">${nome}</td>
                <td><input type="checkbox" checked onchange="recalcularMetas()"></td>
                <td class="meta-individual">${formatarReal(valorLoja)}</td>
                <td class="meta-total-dia">${formatarReal(valorLoja)}</td>
            `;

            tabela.appendChild(tr);
        });
    }

    container.appendChild(tabela);
}

// ================== RECALCULAR ==================
function recalcularMetas() {
    const linhas = Array.from(document.querySelectorAll("#dias tr"));

    let grupos = {};

    linhas.forEach(linha => {
        if (!linha.querySelector("td")) return;

        let data = linha.cells[0].innerText;
        if (!grupos[data]) grupos[data] = [];

        grupos[data].push(linha);
    });

    Object.values(grupos).forEach(linhasDoDia => {
        let meta = converterValor(linhasDoDia[0].querySelector(".meta-total-dia").innerText);

        let ativas = linhasDoDia.filter(l => l.querySelector("input").checked);
        let qtd = ativas.length || 1;

        linhasDoDia.forEach(l => {
            let cb = l.querySelector("input");
            let cell = l.querySelector(".meta-individual");

            if (cb.checked) {
                cell.innerText = formatarReal(meta / qtd);
            } else {
                cell.innerText = formatarReal(0);
            }
        });
    });
}

// ================== LOGIN ==================
const usuarios = [
    { usuario: "Admin", senha: "4321" },
    { usuario: "Luana", senha: "2560" },
    { usuario: "Teste", senha: "0000" }
];

function entrar() {
    const user = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const valido = usuarios.find(u => u.usuario === user && u.senha === senha);

    if (valido) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("app").style.display = "block";
    } else {
        document.getElementById("erro").innerText = "Usuário ou senha incorretos!";
    }
}

// ================== EXPOSIÇÃO GLOBAL (IMPORTANTE) ==================
window.entrar = entrar;
window.lerPlanilha = lerPlanilha;
window.calcularMeta = calcularMeta;
window.recalcularMetas = recalcularMetas;
window.carregarFuncionarias = carregarFuncionarias;
