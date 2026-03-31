// ============================================================
// BANCO DE DADOS LOCAL (localStorage)
// ============================================================

function salvar(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

function listar(chave) {
    return JSON.parse(localStorage.getItem(chave) || "[]");
}

function adicionar(chave, objeto) {
    const lista = listar(chave);
    objeto.id = Date.now();
    lista.push(objeto);
    salvar(chave, lista);
    return objeto.id;
}

function atualizar(chave, id, novo) {
    const lista = listar(chave);
    const idx = lista.findIndex(x => x.id == id);
    if (idx >= 0) {
        lista[idx] = novo;
        salvar(chave, lista);
    }
}

function remover(chave, id) {
    const lista = listar(chave).filter(x => x.id != id);
    salvar(chave, lista);
}

// ============================================================
// USUÁRIOS E LOGIN
// ============================================================

function usuarioLogado() {
    return JSON.parse(localStorage.getItem("logado") || "null");
}

function login(email, senha) {
    const usuarios = listar("usuarios");

    // Cria admin padrão se não existir
    if (!usuarios.some(u => u.email === "admin@admin.com")) {
        usuarios.push({
            id: 1,
            nome: "Administrador",
            email: "admin@admin.com",
            senha: "1234",
            permissao: "admin"
        });
        salvar("usuarios", usuarios);
    }

    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (!user) return false;

    localStorage.setItem("logado", JSON.stringify(user));
    registrarLog("Login", "Usuário entrou no sistema");
    return true;
}

function logout() {
    registrarLog("Logout", "Usuário saiu do sistema");
    localStorage.removeItem("logado");
    location.href = "index.html";
}

// ============================================================
// CRIAÇÃO DE USUÁRIOS
// ============================================================

function criarUsuario(nome, email, senha, permissao) {
    const usuarios = listar("usuarios");

    if (usuarios.some(u => u.email === email)) return false;

    const novo = {
        id: Date.now(),
        nome,
        email,
        senha,
        permissao
    };

    usuarios.push(novo);
    salvar("usuarios", usuarios);

    registrarLog("Criou usuário", email);
    return true;
}

// ============================================================
// PERMISSÕES POR FUNÇÃO
// ============================================================

function areasPermitidas() {
    const user = usuarioLogado();
    if (!user) return [];

    if (user.permissao === "admin") {
        return ["producao", "estoque", "produtos", "insumos", "relatorios", "admin"];
    }

    const mapa = {
        usuario: ["produtos", "insumos", "relatorios"],
        producao: ["producao", "relatorios"],
        estoquista: ["estoque", "relatorios"],
        financeiro: ["relatorios"]
    };

    return mapa[user.permissao] || [];
}

function verificarPermissao(necessaria) {
    const user = usuarioLogado();
    if (!user) return logout();

    if (user.permissao === "admin") return;

    if (user.permissao !== necessaria) {
        alert("Você não tem permissão para acessar esta área.");
        location.href = "inicio.html";
    }
}

// ============================================================
// LOGS DO SISTEMA
// ============================================================

function registrarLog(acao, detalhes) {
    const user = usuarioLogado();
    if (!user) return;

    const logs = listar("logs");
    logs.push({
        usuario: user.email,
        acao,
        detalhes,
        data: new Date().toLocaleString("pt-BR")
    });
    salvar("logs", logs);
}

// ============================================================
// PRODUTOS (COM FICHA TÉCNICA)
// ============================================================

function criarProduto(nome, categoria, preco, estoqueMinimo, fichaTecnica = []) {
    const id = adicionar("produtos", {
        nome,
        categoria,
        preco,
        estoqueMinimo,
        estoqueAtual: 0,
        fichaTecnica
    });

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
// SAÍDA DE PRODUTOS
// ============================================================

function registrarSaida(idProduto, quantidade, motivo = "Saída de estoque") {
    const produtos = listar("produtos");
    const produto = produtos.find(p => p.id === idProduto);
    if (!produto) return;

    if (quantidade <= 0) {
        alert("Quantidade inválida.");
        return;
    }

    if (produto.estoqueAtual < quantidade) {
        alert("Estoque insuficiente.");
        return;
    }

    produto.estoqueAtual -= quantidade;
    salvar("produtos", produtos);

    const saidas = listar("saidas");
    saidas.push({
        id: Date.now(),
        produto: produto.nome,
        quantidade,
        motivo,
        data: new Date().toLocaleString("pt-BR")
    });
    salvar("saidas", saidas);

    registrarLog("Saída de produto",
        `${quantidade} unidades de ${produto.nome} — Motivo: ${motivo}`);
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
if (!localStorage.getItem("saidas")) salvar("saidas", []);
