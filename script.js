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
    "Dracena": ["Suelen", "Nicole"],
    "Panorama": ["Camila", "Jaqueline"],
    "Paulicéia": ["Fernanda", "Patrícia"],
    "Ikeda": ["Camila", "Rafaela"],
    "Junqueirópolis": ["Giovana", "Stefany", "Mariana"]
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

// ================== CIDADE E CARREGAMENTO ==================
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

    if (!Array.isArray(lista)) {
        pegarFuncionarias();
        return;
    }

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
// ================== PLANILHA (CORRIGIDA) ==================
function lerPlanilha() {
    const file = document.getElementById("inputExcel").files[0];
    if (!file) return alert("Selecione a planilha!");

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const nomeAba = workbook.SheetNames.find(n => n.toLowerCase().trim() === "dia");

        if (!nomeAba) return alert("Aba DIA não encontrada!");

        const aba = workbook.Sheets[nomeAba];
        const linhas = XLSX.utils.sheet_to_json(aba, { header: 1 });

        vendasPorDia = {};
        let totalAcumulado = 0;

        for (let i = 1; i < linhas.length; i++) {
            let linha = linhas[i];
            
            // --- NOVA VERIFICAÇÃO AQUI ---
            if (!linha || !linha[0]) continue; // Pula linha vazia
            
            let dataStr = linha[0].toString().trim();
            
            // Se a célula contiver a palavra "TOTAL" (em maiúsculo ou minúsculo), ignora a linha
            if (dataStr.toUpperCase().includes("TOTAL")) {
                console.log("Linha de total ignorada na importação");
                continue; 
            }
            // -----------------------------

            let valor = converterValor(linha[1]);
            vendasPorDia[dataStr] = valor;
            totalAcumulado += valor;
        }
        
        // Atualiza o campo de valor do ano passado apenas com a soma dos dias reais
        document.getElementById("anoPassado").value = totalAcumulado.toFixed(2);
        alert("Planilha carregada com sucesso!");
    };
    reader.readAsArrayBuffer(file);
}

// ================== CÁLCULOS E CALENDÁRIO ==================
function calcularMeta() {
    let anoPassado = parseFloat(document.getElementById("anoPassado").value || 0);
    let percentual = parseFloat(document.getElementById("percentual").value || 0);
    percentualGlobal = percentual;

    let meta = anoPassado * (1 + percentual / 100);
    document.getElementById("metaResultado").innerText = "Meta mensal: " + formatarReal(meta);
    gerarCalendario();
}

function gerarCalendario() {
    pegarFuncionarias();
    let container = document.getElementById("dias");
    container.innerHTML = "";

    let hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = hoje.getMonth();
    let diasNoMes = new Date(ano, mes + 1, 0).getDate();

    let abrirDomingo = document.getElementById("abrirDomingo")?.checked;
    let abrirFeriado = document.getElementById("trabalharFeriado")?.checked;

    // 1. CALCULAR META TOTAL ALVO
    let anoPassado = parseFloat(document.getElementById("anoPassado").value || 0);
    let metaMensalTotalAlvo = anoPassado * (1 + percentualGlobal / 100);
    
    // Calculamos uma média diária simples para preencher buracos (dias úteis sem valor no Excel)
    let mediaDiariaBase = metaMensalTotalAlvo / 25; // Estimativa de 25 dias úteis

    // 2. MAPEAMENTO INICIAL E SOMA DA META DISPONÍVEL
    let somaMetaPlanejadaDiasUteis = 0;
    let metasDiariasIniciais = {};

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);
        let dataPlanilha = `${String(i).padStart(2, "0")} ${meses[mes]} ${ano}`;
        
        let isDomingo = data.getDay() === 0;
        let ehFeriado = isFeriado(data);
        let vaiTrabalhar = true;
        if (isDomingo && !abrirDomingo) vaiTrabalhar = false;
        if (ehFeriado && !abrirFeriado) vaiTrabalhar = false;

        let valorPlanilha = converterValor(vendasPorDia[dataPlanilha]);
        let valorBase = valorPlanilha * (1 + percentualGlobal / 100);
        
        if (vaiTrabalhar) {
            // SE O DIA É ÚTIL MAS ESTÁ EM BRANCO/ZERO, ATRIBUI A MÉDIA BASE
            if (valorBase <= 0) {
                valorBase = mediaDiariaBase;
            }
            metasDiariasIniciais[i] = valorBase;
            somaMetaPlanejadaDiasUteis += valorBase;
        } else {
            metasDiariasIniciais[i] = 0;
        }
    }

    // 3. CÁLCULO DO FATOR DE AJUSTE FINAL
    // Esse fator vai "encolher" ou "esticar" as metas para que a soma dê exatamente o valor alvo
    let fatorAjuste = somaMetaPlanejadaDiasUteis > 0 ? (metaMensalTotalAlvo / somaMetaPlanejadaDiasUteis) : 0;

    // 4. GERAÇÃO DA TABELA
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
            <th>Total Dia (Loja)</th>
        </tr>
    `;

    let semanaAtual = null;
    let totalSemanaLoja = 0, totalSemanaIndiv = 0;
    let totalMesLoja = 0, totalMesIndiv = 0;

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);
        let semana = getSemanaAno(data);
        
        let valorMetaLojaFinal = metasDiariasIniciais[i] * fatorAjuste;
        let metaIndividual = (funcionarias.length > 0 && valorMetaLojaFinal > 0) ? (valorMetaLojaFinal / funcionarias.length) : 0;

        if (semanaAtual !== null && semana !== semanaAtual) {
            tabela.appendChild(criarLinhaSemana(totalSemanaIndiv, totalSemanaLoja));
            totalSemanaLoja = 0; totalSemanaIndiv = 0;
        }

        semanaAtual = semana;
        totalSemanaLoja += valorMetaLojaFinal;
        totalSemanaIndiv += (metaIndividual * funcionarias.length);
        totalMesLoja += valorMetaLojaFinal;
        totalMesIndiv += (metaIndividual * funcionarias.length);

        let dataTexto = `${String(i).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
        let diaSemanaStr = data.getDay() === 0 ? "DOMINGO" : isFeriado(data) ? "FERIADO" : data.toLocaleDateString("pt-BR", { weekday: "long" });

        funcionarias.forEach(nome => {
            let tr = document.createElement("tr");
            if (valorMetaLojaFinal === 0) tr.style.background = "#fff3f3";

            tr.innerHTML = `
                <td>${dataTexto}</td>
                <td>${diaSemanaStr}</td>
                <td class="func">${nome}</td>
                <td><input type="checkbox" ${valorMetaLojaFinal > 0 ? 'checked' : ''} onchange="recalcularMetas()"></td>
                <td class="meta-individual">${formatarReal(metaIndividual)}</td>
                <td class="meta-total-dia">${formatarReal(valorMetaLojaFinal)}</td>
            `;
            tabela.appendChild(tr);
        });

        if (i === diasNoMes) {
            tabela.appendChild(criarLinhaSemana(totalSemanaIndiv, totalSemanaLoja));
            let linhaMes = document.createElement("tr");
            linhaMes.classList.add("linha-total-mensal");
            linhaMes.style.background = "#2c3e50";
            linhaMes.style.color = "white";
            linhaMes.style.fontWeight = "bold";
            linhaMes.innerHTML = `
                <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL DO MÊS:</td>
                <td id="total-mes-individual">${formatarReal(totalMesIndiv)}</td>
                <td id="total-mes-loja">${formatarReal(totalMesLoja)}</td>
            `;
            tabela.appendChild(linhaMes);
        }
    }
    container.appendChild(tabela);
}

function criarLinhaSemana(totalIndiv, totalLoja) {
    let tr = document.createElement("tr");
    tr.classList.add("linha-total-semanal");
    tr.style.background = "#dff7e6";
    tr.style.fontWeight = "bold";

    tr.innerHTML = `
        <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL DA SEMANA:</td>
        <td class="valor-semanal-indiv">${formatarReal(totalIndiv)}</td>
        <td class="valor-semanal-loja">${formatarReal(totalLoja)}</td>
    `;
    return tr;
}

function getSemanaAno(data) {
    let primeiroJan = new Date(data.getFullYear(), 0, 1);
    let dias = Math.floor((data - primeiroJan) / 86400000);
    return Math.ceil((dias + primeiroJan.getDay() + 1) / 7);
}

// ================== FILTRO E RECALCULO ==================
function filtrarTabela() {
    let filtro = document.getElementById("filtro").value;
    let linhas = document.querySelectorAll("#dias tr");

    linhas.forEach((l, i) => {
        if (i === 0) return; 
        let nomeFunc = l.querySelector(".func")?.innerText;

        if (l.classList.contains("linha-total-semanal")) {
            l.style.display = ""; 
            return;
        }

        if (nomeFunc) {
            l.style.display = (filtro === "todas" || nomeFunc === filtro) ? "" : "none";
        }
    });
    recalcularMetas(); 
}

function recalcularMetas() {
    const linhas = Array.from(document.querySelectorAll("#dias tr"));
    
    // Agrupamos as linhas por data para saber quem trabalha no mesmo dia
    let dadosPorData = {};

    // 1. Primeiro Passo: Mapear a estrutura e calcular as novas metas individuais
    linhas.forEach(linha => {
        if (linha.querySelector("th") || linha.classList.contains("linha-total-semanal") || linha.classList.contains("linha-total-mensal")) return;

        let dataTexto = linha.cells[0].innerText;
        if (!dadosPorData[dataTexto]) dadosPorData[dataTexto] = [];
        dadosPorData[dataTexto].push(linha);
    });

    // 2. Segundo Passo: Redistribuir a meta dentro de cada dia
    for (let data in dadosPorData) {
        let linhasDoDia = dadosPorData[data];
        let metaLoja = converterValor(linhasDoDia[0].querySelector(".meta-total-dia").innerText);
        
        // Contamos quantas funcionárias estão "Ativas" (checkbox marcado)
        let funcionariasAtivas = linhasDoDia.filter(l => l.querySelector("input[type='checkbox']").checked);

        linhasDoDia.forEach(linha => {
            let cb = linha.querySelector("input[type='checkbox']");
            let celulaIndividual = linha.querySelector(".meta-individual");

            if (cb.checked) {
                // Se estiver ativa, recebe a meta da loja dividida pelo total de ativas
                let novaMetaIndiv = metaLoja / funcionariasAtivas.length;
                celulaIndividual.innerText = formatarReal(novaMetaIndiv);
            } else {
                // Se estiver de folga (desativada), a meta individual é 0
                celulaIndividual.innerText = formatarReal(0);
            }
        });
    }

    // 3. Terceiro Passo: Somar os totais (Semana e Mês) com os novos valores
    let somaSemanaIndiv = 0;
    let somaSemanaLoja = 0;
    let somaMesIndiv = 0;
    let somaMesLoja = 0;

    linhas.forEach((linha) => {
        if (linha.querySelector("th")) return;

        // Se for linha de dados (não é total)
        if (!linha.classList.contains("linha-total-semanal") && !linha.classList.contains("linha-total-mensal")) {
            // Só somamos para o total se a linha estiver visível (filtro) e o checkbox marcado
            if (linha.style.display !== "none") {
                let vIndiv = converterValor(linha.querySelector(".meta-individual").innerText);
                let vLoja = converterValor(linha.querySelector(".meta-total-dia").innerText);
                
                // IMPORTANTE: Para a Meta da Loja não duplicar no total quando houver 2 funcionárias, 
                // somamos a loja apenas uma vez por dia (usando o índice da linha como controle)
                // Mas aqui, como cada funcionária tem sua meta ind, somamos a ind individualmente.
                
                somaSemanaIndiv += vIndiv;
                somaMesIndiv += vIndiv;
                
                // Lógica para não duplicar a Meta da Loja no somatório total:
                // Verificamos se é a primeira funcionária visível daquela data
                let dataAtual = linha.cells[0].innerText;
                let primeiraDaData = linhas.find(l => l.cells[0]?.innerText === dataAtual && l.style.display !== "none");
                
                if (linha === primeiraDaData) {
                    somaSemanaLoja += vLoja;
                    somaMesLoja += vLoja;
                }
            }
        }

        // Atualiza as linhas de Total da Semana
        if (linha.classList.contains("linha-total-semanal")) {
            linha.querySelector(".valor-semanal-indiv").innerText = formatarReal(somaSemanaIndiv);
            linha.querySelector(".valor-semanal-loja").innerText = formatarReal(somaSemanaLoja);
            
            linha.style.display = (somaSemanaLoja === 0) ? "none" : "";
            somaSemanaIndiv = 0;
            somaSemanaLoja = 0;
        }
        
        // Atualiza a linha de Total do Mês
        if (linha.classList.contains("linha-total-mensal")) {
            document.getElementById("total-mes-individual").innerText = formatarReal(somaMesIndiv);
            document.getElementById("total-mes-loja").innerText = formatarReal(somaMesLoja);
        }
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
    let tabela = document.querySelector("#dias table");
    if (!tabela) return alert("Tabela não encontrada!");

    let dados = [];
    let linhas = tabela.querySelectorAll("tr");

    linhas.forEach(linha => {
        if (linha.style.display === "none") return;
        let row = [];
        linha.querySelectorAll("th, td").forEach(celula => {
            row.push(celula.innerText);
        });
        dados.push(row);
    });

    let ws = XLSX.utils.aoa_to_sheet(dados);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, "relatorio_metas.xlsx");
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
