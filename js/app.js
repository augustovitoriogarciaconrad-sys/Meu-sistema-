
    registrarLog("Criou produto", nome);
    return id;
}

// ============================================================
// INSUMOS
// ============================================================

function criarInsumo(nome, categoria, quantidade, validade, unidade = "un") {
    const id = adicionar("insumos", {
        nome,
        categoria,
        estoqueAtual: quantidade,
        unidade,
        validade
    });

    registrarLog("Criou insumo", nome);
    return id;
}

// ============================================================
// CONSUMO AUTOMÁTICO DE INSUMOS
// ============================================================

function consumirInsumos(produto, quantidade) {
    const insumos = listar("insumos");
    let consumo = listar("consumo") || [];

    produto.fichaTecnica.forEach(item => {
        const insumo = insumos.find(i => i.id === item.idInsumo);
        if (!insumo) return;

        const total = item.qtdPorUnidade * quantidade;
        insumo.estoqueAtual -= total;

        registrarLog("Insumo consumido",
            `${total.toFixed(2)} ${insumo.unidade} de ${insumo.nome} usados na produção de ${quantidade} ${produto.nome}`);

        consumo.push({
            data: new Date().toLocaleString("pt-BR"),
            produto: produto.nome,
            quantidade,
            insumo: insumo.nome,
            total
        });
    });

    salvar("insumos", insumos);
    salvar("consumo", consumo);
}

// ============================================================
// PRODUÇÃO REAL
// ============================================================

function produzirProduto(idProduto, quantidade) {
    const produtos = listar("produtos");
    const produto = produtos.find(p => p.id === idProduto);
    if (!produto) return;

    consumirInsumos(produto, quantidade);

    produto.estoqueAtual += quantidade;

    registrarLog("Produção registrada",
        `Produzido ${quantidade} unidades de ${produto.nome}`);

    salvar("produtos", produtos);
}

// ============================================================
// PERFIL
// ============================================================

function alterarSenhaUsuario(id, novaSenha) {
    const usuarios = listar("usuarios");
    const user = usuarios.find(u => u.id == id);
    if (!user) return;

    user.senha = novaSenha;
    atualizar("usuarios", id, user);
    registrarLog("Alterou senha", user.email);
}

// ============================================================
// LIMPEZA AUTOMÁTICA DE LOGS
// ============================================================

function limpezaAutomaticaLogs() {
    let logs = listar("logs");
    let config = listar("configSistema");

    if (!config) return;

    if (config.retencaoDias > 0) {
        const agora = new Date();

        logs = logs.filter(log => {
            const dataLog = new Date(log.data);
            const diff = (agora - dataLog) / (1000 * 60 * 60 * 24);
            return diff <= config.retencaoDias;
        });
    }

    if (logs.length > config.limiteRegistros) {
        const excesso = logs.length - config.limiteRegistros;
        logs.splice(0, excesso);
    }

    salvar("logs", logs);
}

limpezaAutomaticaLogs();

// ============================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================

if (!localStorage.getItem("produtos")) salvar("produtos", []);
if (!localStorage.getItem("insumos")) salvar("insumos", []);
if (!localStorage.getItem("producao")) salvar("producao", []);
if (!localStorage.getItem("usuarios")) salvar("usuarios", []);
if (!localStorage.getItem("logs")) salvar("logs", []);
if (!localStorage.getItem("consumo")) salvar("consumo", []);
