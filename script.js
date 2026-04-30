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

// ================== FUNCIONÁRIAS ==================
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
    if (!valor) return 0;
    if (typeof valor === "number") return valor;

    let str = valor.toString()
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    let n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}

// ================== LOGIN (CORRIGIDO) ==================
const usuarios = [
    { usuario: "Admin", senha: "4321" },
    { usuario: "Luana", senha: "2560" },
    { usuario: "Teste", senha: "0000" }
];

window.entrar = function () {
    const user = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const valido = usuarios.find(u => u.usuario === user && u.senha === senha);

    if (valido) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("app").style.display = "block";
    } else {
        document.getElementById("erro").innerText = "Usuário ou senha incorretos!";
    }
};

// ================== FUNCIONÁRIAS ==================
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
            if (!texto || texto.toUpperCase().includes("TOTAL")) continue;

            texto = texto.replace(/\//g, " ").replace(/\s+/g, " ").trim();
            let partes = texto.split(" ");

            if (partes.length < 3) continue;

            let dia = partes[0].padStart(2, "0");
            let mes = partes[1];
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

// ================== CALENDÁRIO ==================
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
            <th>Total Dia</th>
        </tr>
    `;

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);

        funcionarias.forEach(nome => {
            let tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${String(i).padStart(2, "0")}/${mes + 1}/${ano}</td>
                <td>${data.getDay()}</td>
                <td class="func">${nome}</td>
                <td><input type="checkbox" checked onchange="recalcularMetas()"></td>
                <td class="meta-individual">R$ 0,00</td>
                <td class="meta-total-dia">R$ 0,00</td>
            `;

            tabela.appendChild(tr);
        });
    }

    container.appendChild(tabela);
}

// ================== RECALCULAR (CORRIGIDO) ==================
function recalcularMetas() {
    let linhas = document.querySelectorAll("#dias tr");

    let dadosPorData = {};

    linhas.forEach(linha => {
        if (!linha.querySelector("td")) return;

        let data = linha.cells[0].innerText;

        if (!dadosPorData[data]) dadosPorData[data] = [];
        dadosPorData[data].push(linha);
    });

    Object.values(dadosPorData).forEach(linhasDoDia => {

        let metaLoja = 100;

        let ativas = linhasDoDia.filter(l =>
            l.querySelector("input")?.checked
        );

        let qtd = ativas.length || 1;

        linhasDoDia.forEach(linha => {
            let cb = linha.querySelector("input");
            let cell = linha.querySelector(".meta-individual");

            if (cb?.checked) {
                cell.innerText = formatarReal(metaLoja / qtd);
            } else {
                cell.innerText = formatarReal(0);
            }
        });
    });
}

// ================== EXPORTAÇÃO PDF ==================
function exportarPDF() {
    const tabela = document.querySelector("#dias table");
    if (!tabela) return alert("Gere a tabela primeiro!");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    // 1. DADOS DO CABEÇALHO
    const nomeFunc = document.getElementById("filtro").value;
    const nomeCidade = document.getElementById("cidade").value;
    const mesAtual = meses[new Date().getMonth()];
    const anoAtual = new Date().getFullYear();

    // 2. TEXTOS DO TOPO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ACOMPANHAMENTO DE METAS E INDICADORES", 150, 9, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Funcionária: ${nomeFunc === 'todas' ? 'Todas' : nomeFunc}`, 6, 16);
    doc.text(`Cidade: ${nomeCidade}`, 100, 16);
    doc.text(`Período: ${mesAtual} / ${anoAtual}`, 291, 16, { align: "right" });

    // 3. PROCESSAMENTO DAS LINHAS
    const linhasPDF = [];
    const trs = tabela.querySelectorAll("tr");

    trs.forEach((tr) => {
        if (tr.style.display === "none") return;
        const celulas = tr.querySelectorAll("th, td");
        let linhaDados = [];

        if (tr.classList.contains("linha-total-semanal")) {
            // INVERTIDO: Loja (3) antes de Individual (2)
            linhaDados = ["TOTAL", "SEMANA", 
                tr.querySelector(".valor-semanal-loja")?.innerText || "", // Meta Loja agora no índice 2
                tr.querySelector(".valor-semanal-indiv")?.innerText || "", // Meta Ind agora no índice 3
                "", "", "", "", "", "", "", "", "", "", ""];
        } 
        else if (tr.classList.contains("linha-total-mensal")) {
            // INVERTIDO: Loja antes de Individual
            linhaDados = ["TOTAL", "MÊS", 
                document.getElementById("total-mes-loja")?.innerText || "", 
                document.getElementById("total-mes-individual")?.innerText || "", 
                "", "", "", "", "", "", "", "", "", "", ""];
        } 
        else if (!tr.querySelector("th")) {
            linhaDados = [
                celulas[0]?.innerText, // Data
                celulas[1]?.innerText, // Dia
                celulas[5]?.innerText, // Meta Loja (Invertido)
                celulas[4]?.innerText, // Meta Ind. (Invertido)
                "", "", "", "", "", "", "", "", "", "", ""
            ];
        } else { return; }
        linhasPDF.push(linhaDados);
    });

    // 4. GERAR TABELA
    doc.autoTable({
        // Cabeçalho com Meta Loja antes de Meta Ind.
        head: [["Data", "Dia", "Meta Loja", "Meta Ind.", "Realizado", "Boleto Méd.", "Itens", "BP 33%", "BT 31%", "B1 25%", "Fluxo 28%", "ID 115%", "Penet. 98%", "Resg. 54%", "SKIN 2,1%"]],
        body: linhasPDF,
        startY: 20, 
        theme: 'grid',
        headStyles: { 
            fillColor: [41, 128, 185], 
            fontSize: 6.5, 
            halign: 'center', 
            cellPadding: 0.8 
        },
        styles: { 
            fontSize: 7, 
            cellPadding: 0.9, 
            valign: 'middle',
            lineWidth: 0.1
        },
        columnStyles: {
            2: { halign: 'right' }, // Agora é Meta Loja
            3: { halign: 'right' }  // Agora é Meta Ind.
        },
        margin: { left: 6, right: 6, bottom: 8 },
        tableWidth: 'auto', 
        didParseCell: function(data) {
            if (data.row.raw[0] === "TOTAL") {
                data.cell.styles.fontStyle = 'bold';
                if (data.row.raw[1] === "SEMANA") {
                    data.cell.styles.fillColor = [223, 247, 230];
                } else if (data.row.raw[1] === "MÊS") {
                    data.cell.styles.fillColor = [44, 62, 80];
                    data.cell.styles.textColor = [255, 255, 255];
                }
            }
        }
    });

    doc.save(`Metas_${nomeCidade}_${nomeFunc}.pdf`);
}
// ================== EXPORTAÇÃO EXCEL ==================
function exportarExcel() {
    const tabela = document.querySelector("#dias table");
    if (!tabela) return alert("Tabela não encontrada!");

    const nomeFunc = document.getElementById("filtro").value;
    const nomeCidade = document.getElementById("cidade").value;
    const mesAtual = meses[new Date().getMonth()];
    const anoAtual = new Date().getFullYear();

    const dados = [];

    // Cabeçalho (igual ao PDF)
    dados.push([
        "Data", "Dia", "Meta Loja", "Meta Ind.",
        "Realizado", "Boleto Méd.", "Itens",
        "BP 33%", "BT 31%", "B1 25%",
        "Fluxo 28%", "ID 115%", "Penet. 98%",
        "Resg. 54%", "SKIN 2,1%"
    ]);

    const linhas = tabela.querySelectorAll("tr");

    linhas.forEach(tr => {
        if (tr.style.display === "none") return;

        let linhaDados = [];

        // TOTAL SEMANA
        if (tr.classList.contains("linha-total-semanal")) {
            linhaDados = [
                "TOTAL", "SEMANA",
                tr.querySelector(".valor-semanal-loja")?.innerText || "",
                tr.querySelector(".valor-semanal-indiv")?.innerText || "",
                "", "", "", "", "", "", "", "", "", "", ""
            ];
        }

        // TOTAL MÊS
        else if (tr.classList.contains("linha-total-mensal")) {
            linhaDados = [
                "TOTAL", "MÊS",
                document.getElementById("total-mes-loja")?.innerText || "",
                document.getElementById("total-mes-individual")?.innerText || "",
                "", "", "", "", "", "", "", "", "", "", ""
            ];
        }

        // LINHAS NORMAIS
        else if (!tr.querySelector("th")) {
            const celulas = tr.querySelectorAll("th, td");

            linhaDados = [
                celulas[0]?.innerText || "", // Data
                celulas[1]?.innerText || "", // Dia
                celulas[5]?.innerText || "", // Meta Loja (invertido)
                celulas[4]?.innerText || "", // Meta Ind (invertido)
                celulas[2]?.innerText || "", // Realizado
                celulas[3]?.innerText || "", // Boleto Méd.
                celulas[6]?.innerText || "", // Itens
                celulas[7]?.innerText || "",
                celulas[8]?.innerText || "",
                celulas[9]?.innerText || "",
                celulas[10]?.innerText || "",
                celulas[11]?.innerText || "",
                celulas[12]?.innerText || "",
                celulas[13]?.innerText || "",
                celulas[14]?.innerText || ""
            ];
        } else {
            return;
        }

        dados.push(linhaDados);
    });

    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");

    XLSX.writeFile(
        wb,
        `Metas_${nomeCidade}_${nomeFunc}.xlsx`
    );
}
// ========= Senha =======
// ======= USUÁRIOS =======
const usuarios = [
    { usuario: "Admin", senha: "4321" },
    { usuario: "Luana", senha: "2560" },
    { usuario: "Teste", senha: "0000" }
];

// ========= LOGIN =========
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
