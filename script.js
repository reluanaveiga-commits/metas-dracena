// ================== VARIÁVEIS ==================
let funcionarias = [];
let vendasPorDia = {};
let percentualGlobal = 0;
let pesosFuncionarias = {}; // nome -> % da meta que essa funcionária recebe

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ================== FERIADOS ==================
const feriados = [
    "01/01", "03/04", "21/04", "01/05", "07/09",
    "12/10", "02/11", "15/11", "25/12", "20/11"
];

function isFeriado(data) {
    let dia = String(data.getDate()).padStart(2, "0");
    let mes = String(data.getMonth() + 1).padStart(2, "0");
    return feriados.includes(`${dia}/${mes}`);
}

// ================== FUNCIONÁRIAS POR CIDADE ==================
const funcionariosPorCidade = {
   "Ikeda": ["Franciele", "Debora", "Estela"],
    "Dracena": ["Suelen", "Nicolie", "Andressa"],
    "Junqueirópolis": ["Giovana", "Stefany"],
    "Tupi Paulista": ["Mariana", "Bruna"],
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

    const pesos = pesosIguaisArray(lista.length);

    lista.forEach((nome, i) => {
        container.appendChild(criarLinhaFuncionaria(nome, pesos[i]));
    });
    pegarFuncionarias();
}

// Gera N percentuais iguais que somam exatamente 100 (o último absorve o resto do arredondamento)
function pesosIguaisArray(n) {
    if (n <= 0) return [];
    const base = Math.floor((100 / n) * 10) / 10;
    const pesos = new Array(n).fill(base);
    pesos[n - 1] = +(100 - base * (n - 1)).toFixed(1);
    return pesos;
}

function criarLinhaFuncionaria(nome, peso) {
    const div = document.createElement("div");
    div.classList.add("funcionario");
    div.innerHTML = `
        <div class="funcionario-topo">
            <input type="text" class="nome-funcionaria" value="${nome}" placeholder="Nome da funcionária">
            <button onclick="this.closest('.funcionario').remove(); redistribuirAposRemocao(); pegarFuncionarias(); recalcularMetas();">
                <svg class="icon"><use href="#icon-lixeira"></use></svg>
            </button>
        </div>
        <label class="funcionario-peso">
            <span>% da meta</span>
            <input type="number" class="percentual-funcionaria" value="${peso}" min="0" max="100" step="0.1"
                oninput="redistribuirPercentuais(this); pegarFuncionarias(); recalcularMetas();">
        </label>
    `;
    return div;
}

function adicionarFuncionaria() {
    const container = document.getElementById("listaFuncionarias");
    if (!container) return;

    const div = criarLinhaFuncionaria("", "0");
    container.appendChild(div);

    const qtdAtual = container.querySelectorAll(".funcionario").length;
    const inputPeso = div.querySelector(".percentual-funcionaria");
    inputPeso.value = (100 / qtdAtual).toFixed(1);
    redistribuirPercentuais(inputPeso);

    div.querySelector(".nome-funcionaria").focus();
    pegarFuncionarias();
}

// Ao mudar o % de uma funcionária, redistribui a diferença entre as demais
// (mantendo a proporção relativa entre elas), pra soma total ficar sempre em 100%.
function redistribuirPercentuais(inputAlterado) {
    const linhas = Array.from(document.querySelectorAll("#listaFuncionarias .funcionario"));
    const inputs = linhas.map(l => l.querySelector(".percentual-funcionaria")).filter(Boolean);

    if (inputs.length <= 1) {
        if (inputs[0]) inputs[0].value = "100";
        atualizarTotalPercentual();
        return;
    }

    let novoValor = parseFloat(inputAlterado.value);
    if (isNaN(novoValor)) novoValor = 0;
    novoValor = Math.max(0, Math.min(100, novoValor));
    inputAlterado.value = novoValor;

    // A diferença é sempre dividida IGUALMENTE entre as demais (não proporcional ao valor anterior delas)
    const outros = inputs.filter(inp => inp !== inputAlterado);
    const parteIgual = Math.floor(((100 - novoValor) / outros.length) * 10) / 10;

    outros.forEach((inp, i) => {
        // A última absorve a diferença de arredondamento pra soma ficar exatamente 100
        const ehUltima = i === outros.length - 1;
        const novaParte = ehUltima
            ? +(100 - novoValor - parteIgual * (outros.length - 1)).toFixed(1)
            : parteIgual;
        inp.value = novaParte;
    });

    atualizarTotalPercentual();
}

// Chamado ao remover uma funcionária: volta as % restantes para uma divisão igual entre elas
function redistribuirAposRemocao() {
    const inputs = Array.from(document.querySelectorAll("#listaFuncionarias .percentual-funcionaria"));
    if (inputs.length === 0) return;

    const pesos = pesosIguaisArray(inputs.length);
    inputs.forEach((inp, i) => inp.value = pesos[i]);
    atualizarTotalPercentual();
}

// Botão "Redefinir %": volta todas as funcionárias para a divisão igual, como no início
function resetarPercentuais() {
    const inputs = Array.from(document.querySelectorAll("#listaFuncionarias .percentual-funcionaria"));
    if (inputs.length === 0) return;

    const pesos = pesosIguaisArray(inputs.length);
    inputs.forEach((inp, i) => inp.value = pesos[i]);

    pegarFuncionarias();
    recalcularMetas();
}

function atualizarTotalPercentual() {
    const el = document.getElementById("totalPercentual");
    if (!el) return;
    const inputs = document.querySelectorAll("#listaFuncionarias .percentual-funcionaria");
    if (inputs.length === 0) { el.textContent = ""; return; }
    const soma = Array.from(inputs).reduce((acc, inp) => acc + (parseFloat(inp.value) || 0), 0);
    el.textContent = `Total distribuído: ${soma.toFixed(1)}%`;
}

function pegarFuncionarias() {
    let linhas = document.querySelectorAll("#listaFuncionarias .funcionario");
    funcionarias = [];
    pesosFuncionarias = {};
    linhas.forEach(linha => {
        let nome = linha.querySelector(".nome-funcionaria")?.value.trim();
        if (!nome) return;
        funcionarias.push(nome);
        let peso = parseFloat(linha.querySelector(".percentual-funcionaria")?.value);
        pesosFuncionarias[nome] = isNaN(peso) || peso < 0 ? 0 : peso;
    });
    atualizarFiltro();
    atualizarTotalPercentual();
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
// Converte a célula de data (texto ou número serial do Excel) para a chave canônica DD/MM/AAAA
function normalizarDataChave(valorCelula) {
    if (valorCelula === null || valorCelula === undefined) return null;

    if (typeof valorCelula === "number") {
        const info = XLSX.SSF?.parse_date_code(valorCelula);
        if (!info) return null;
        return `${String(info.d).padStart(2, "0")}/${String(info.m).padStart(2, "0")}/${info.y}`;
    }

    const texto = valorCelula.toString().trim();

    let m = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;

    m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;

    // Formato "DD <mês em texto> AAAA" — aceita variações como "02 Ago 2026",
    // "02 ago. 2026", "02 de Agosto de 2026", com ou sem ponto/acento.
    m = texto.match(/^(\d{1,2})\D+(\d{4})$/);
    if (m) {
        const textoLower = texto.toLowerCase();
        const idxMes = meses.findIndex(mesAbrev => textoLower.includes(mesAbrev.toLowerCase()));
        if (idxMes >= 0) return `${m[1].padStart(2, "0")}/${String(idxMes + 1).padStart(2, "0")}/${m[2]}`;
    }

    return null;
}

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
        let linhasIgnoradas = 0;

        for (let i = 1; i < linhas.length; i++) {
            let linha = linhas[i];

            if (!linha || !linha[0]) continue; // Pula linha vazia

            let dataStr = linha[0].toString().trim();

            // Se a célula contiver a palavra "TOTAL" (em maiúsculo ou minúsculo), ignora a linha
            if (dataStr.toUpperCase().includes("TOTAL")) {
                console.log("Linha de total ignorada na importação");
                continue;
            }

            let chave = normalizarDataChave(linha[0]);
            if (!chave) {
                linhasIgnoradas++;
                console.warn("Data não reconhecida na linha, ignorada:", dataStr);
                continue;
            }

            let valor = converterValor(linha[1]);
            vendasPorDia[chave] = valor;
            totalAcumulado += valor;
        }

        // Atualiza o campo de valor do ano passado apenas com a soma dos dias reais
        document.getElementById("anoPassado").value = formatarReal(totalAcumulado);

        if (linhasIgnoradas > 0) {
            alert(`Planilha carregada, mas ${linhasIgnoradas} linha(s) com data em formato não reconhecido foram ignoradas.`);
        } else {
            alert("Planilha carregada com sucesso!");
        }
    };
    reader.readAsArrayBuffer(file);
}

// ================== CÁLCULOS E CALENDÁRIO ==================
function calcularMeta() {
    let anoPassado = converterValor(document.getElementById("anoPassado").value);
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
    let anoPassado = converterValor(document.getElementById("anoPassado").value);
    let metaMensalTotalAlvo = anoPassado * (1 + percentualGlobal / 100);
    
    // Calculamos uma média diária simples para preencher buracos (dias úteis sem valor no Excel)
    let mediaDiariaBase = metaMensalTotalAlvo / 25; // Estimativa de 25 dias úteis

    // 2. MAPEAMENTO INICIAL E SOMA DA META DISPONÍVEL
    let somaMetaPlanejadaDiasUteis = 0;
    let metasDiariasIniciais = {};

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);
        let chaveDia = `${String(i).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;

        let isDomingo = data.getDay() === 0;
        let ehFeriado = isFeriado(data);
        let vaiTrabalhar = true;
        if (isDomingo && !abrirDomingo) vaiTrabalhar = false;
        if (ehFeriado && !abrirFeriado) vaiTrabalhar = false;

        let valorPlanilha = converterValor(vendasPorDia[chaveDia]);
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

    // Soma dos pesos (%) de todas as funcionárias. Se ninguém tiver peso definido,
    // cai de volta para divisão igual entre todas.
    let somaPesos = funcionarias.reduce((acc, nome) => acc + (pesosFuncionarias[nome] || 0), 0);
    if (somaPesos <= 0 && funcionarias.length > 0) {
        funcionarias.forEach(nome => { pesosFuncionarias[nome] = 1; });
        somaPesos = funcionarias.length;
    }

    for (let i = 1; i <= diasNoMes; i++) {
        let data = new Date(ano, mes, i);
        let semana = getSemanaAno(data);

        let valorMetaLojaFinal = metasDiariasIniciais[i] * fatorAjuste;

        if (semanaAtual !== null && semana !== semanaAtual) {
            tabela.appendChild(criarLinhaSemana(totalSemanaIndiv, totalSemanaLoja));
            totalSemanaLoja = 0; totalSemanaIndiv = 0;
        }

        semanaAtual = semana;
        totalSemanaLoja += valorMetaLojaFinal;
        totalMesLoja += valorMetaLojaFinal;

        let dataTexto = `${String(i).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
        let diaSemanaStr = data.getDay() === 0 ? "DOMINGO" : isFeriado(data) ? "FERIADO" : data.toLocaleDateString("pt-BR", { weekday: "long" });

        funcionarias.forEach(nome => {
            let peso = pesosFuncionarias[nome] || 0;
            let metaIndividual = (valorMetaLojaFinal > 0 && somaPesos > 0) ? (valorMetaLojaFinal * (peso / somaPesos)) : 0;

            totalSemanaIndiv += metaIndividual;
            totalMesIndiv += metaIndividual;

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

        // Soma os pesos (%) apenas das que estão ativas nesse dia
        let somaPesosAtivas = funcionariasAtivas.reduce((acc, l) => {
            let nome = l.querySelector(".func")?.innerText;
            return acc + (pesosFuncionarias[nome] || 0);
        }, 0);

        linhasDoDia.forEach(linha => {
            let cb = linha.querySelector("input[type='checkbox']");
            let celulaIndividual = linha.querySelector(".meta-individual");
            let nome = linha.querySelector(".func")?.innerText;

            if (cb.checked) {
                // Se estiver ativa, recebe a meta da loja proporcional ao seu % entre as ativas
                let peso = pesosFuncionarias[nome] || 0;
                let novaMetaIndiv = somaPesosAtivas > 0
                    ? metaLoja * (peso / somaPesosAtivas)
                    : metaLoja / funcionariasAtivas.length;
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
// As senhas não ficam em texto puro no código: é guardado o hash SHA-256 de "usuario:senha".
const usuarios = [
    { usuario: "Admin", hash: "bc0a9e9db86da5bd28a5296bbd9f65193ba466a1313635422ae610982af8b87f" },
    { usuario: "Luana", hash: "0ef84e0e15430dee47d85f7d6431a622881e8ac27808f1278d7fe7b134fc64e1" },
    { usuario: "Teste", hash: "b624292294f04d3bf3ebc4c72b7e4ddf8077d0103af678845caa41a97b138c3b" }
];

async function sha256(texto) {
    const buffer = new TextEncoder().encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========= LOGIN =========
async function entrar() {
    const user = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    const hashDigitado = await sha256(`${user}:${senha}`);
    const valido = usuarios.find(u => u.usuario === user && u.hash === hashDigitado);

    if (valido) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("erro").innerText = "";
    } else {
        document.getElementById("erro").innerText = "Usuário ou senha incorretos!";
    }
}

function sair() {
    document.getElementById("app").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("usuario").value = "";
    document.getElementById("senha").value = "";
    document.getElementById("erro").innerText = "";
}
