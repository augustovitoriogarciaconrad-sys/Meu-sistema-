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
        data: new Date().toLocaleString()
    });
    salvar("logs", logs);
}
// ============================================================
// USUÁRIOS E LOGIN
// ============================================================

function usuarioLogado() {
    return JSON.parse(localStorage.getItem("logado") || "null");
}

function login(email, senha) {
    const usuarios = listar("usuarios");

    // cria usuário admin padrão se não existir
    if (usuarios.length === 0) {
        usuarios.push({
            id: 1,
            nome: "Administrador",
            email: "admin@admin.com",
            senha: "1234",
            permissao: "admin" // admin pode tudo
        });
        salvar("usuarios", usuarios);
    }

    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (!user) return false;

    localStorage.setItem("logado", JSON.stringify(user));
    registrarLog("Login", "Usuário entrou no sistema");
    return true;
}

// ============================================================
// PERMISSÕES POR FUNÇÃO
// ============================================================
//
// admin      → pode tudo
// financeiro → só páginas e ações financeiras
// producao   → só páginas e ações de produção
// estoquista → só estoque
// usuario    → acesso básico
//

function verificarPermissao(necessaria) {
    const user = usuarioLogado();
    if (!user) return logout();

    // ADMIN sempre tem acesso
    if (user.permissao === "admin") return;

    // FINANCEIRO
    if (necessaria === "financeiro" && user.permissao !== "financeiro") {
        alert("Você não tem permissão para acessar o Financeiro.");
        location.href = "home.html";
        return;
    }

    // PRODUÇÃO
    if (necessaria === "producao" && user.permissao !== "producao") {
        alert("Você não tem permissão para acessar Produção.");
        location.href = "home.html";
        return;
    }

   // ESTOQUISTA
if (necessaria === "estoquista" && user.permissao !== "estoquista") {
    alert("Você não tem permissão para acessar a Área de Estoque.");
    location.href = "home.html";
    return;

    }

    // USUÁRIO COMUM
    if (necessaria === "usuario" && user.permissao !== "usuario") {
        alert("Você não tem permissão para acessar esta área.");
        location.href = "home.html";
        return;
    }
}

function logout() {
    registrarLog("Logout", "Usuário saiu do sistema");
    localStorage.removeItem("logado");
    location.href = "index.html";
}
// ============================================================
// PRODUTOS
// ============================================================

function criarProduto(nome, categoria, preco, estoqueMinimo) {
    const id = adicionar("produtos", {
        nome,
        categoria,
        preco,
        estoqueMinimo
    });
    registrarLog("Criou produto", nome);
    return id;
}

// ============================================================
// INSUMOS
// ============================================================

function criarInsumo(nome, categoria, quantidade, validade) {
    const id = adicionar("insumos", {
        nome,
        categoria,
        quantidade,
        validade
    });
    registrarLog("Criou insumo", nome);
    return id;
}

// ============================================================
// PRODUÇÃO
// ============================================================

function registrarProducao(produtoId, quantidade, custo) {
    const id = adicionar("producao", {
        produtoId,
        quantidade,
        custo,
        data: new Date().toLocaleDateString()
    });
    registrarLog("Registrou produção", "Produto ID " + produtoId);
    return id;
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
}function alterarSenha(email, novaSenha) {
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].email === email) {
            usuarios[i].senha = novaSenha; // troca a senha
        }
    }

    localStorage.setItem("usuarios", JSON.stringify(usuarios)); // salva
}alterarSenha(emailDoUsuarioLogado, senhaNovaDigitada);
    

// ============================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================

// cria tabelas se não existirem
if (!localStorage.getItem("produtos")) salvar("produtos", []);
if (!localStorage.getItem("insumos")) salvar("insumos", []);
if (!localStorage.getItem("producao")) salvar("producao", []);
if (!localStorage.getItem("usuarios")) salvar("usuarios", []);
if (!localStorage.getItem("logs")) salvar("logs", []);
