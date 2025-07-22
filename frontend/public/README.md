# 📁 Estrutura do Frontend - BSQA Card Writer

## 🏗️ **Organização dos Arquivos**

```
frontend/public/
├── 📄 index.html              # Página principal da aplicação
├── 📄 config.html             # Página de configurações do usuário
├── 📁 assets/                 # Recursos estáticos
│   ├── 📄 style.css           # Estilos globais da aplicação
│   └── 📄 favicon.ico         # Ícone do site
├── 📁 js/                     # Scripts JavaScript
│   ├── 📄 main.js             # Utilitários globais e componentes
│   ├── 📄 index.js            # Lógica específica da página principal
│   └── 📄 config.js           # Lógica específica da página de configurações
├── 📁 components/             # Componentes HTML reutilizáveis
│   ├── 📄 header.html         # Cabeçalho da aplicação
│   ├── 📄 footer.html         # Rodapé da aplicação
│   └── 📄 modal.html          # Modal de documentação
└── 📁 docs/                   # Documentação
    └── 📄 software-requirements.md  # Documentação técnica
```

## 🎯 **Responsabilidades dos Arquivos**

### **📄 Páginas HTML:**
- **`index.html`**: Interface principal para análise de requisitos
- **`config.html`**: Interface para configurações do usuário

### **📁 Assets:**
- **`style.css`**: Sistema completo de estilos com temas (dark/light/auto)
- **`favicon.ico`**: Ícone da aplicação

### **📁 JavaScript:**
- **`main.js`**: Funções utilitárias globais, carregamento de componentes e temas
- **`index.js`**: Lógica específica da página principal (formulário, upload, análise)
- **`config.js`**: Lógica específica da página de configurações (salvamento, validação)

### **📁 Components:**
- **`header.html`**: Cabeçalho reutilizável com navegação
- **`footer.html`**: Rodapé reutilizável com links
- **`modal.html`**: Modal reutilizável para documentação

### **📁 Docs:**
- **`software-requirements.md`**: Documentação técnica em markdown

## 🔧 **Características Técnicas**

### **✅ Modularização:**
- JavaScript separado por responsabilidade
- CSS organizado com variáveis e temas
- Componentes HTML reutilizáveis

### **✅ Responsividade:**
- Layout adaptativo para mobile e desktop
- Sistema de temas responsivo

### **✅ Performance:**
- Carregamento dinâmico de componentes
- Scripts como módulos ES6
- Cache de configurações no localStorage

### **✅ Manutenibilidade:**
- Estrutura clara e organizada
- Separação de responsabilidades
- Documentação integrada

## 🚀 **Como Usar**

1. **Desenvolvimento**: Abra `index.html` no navegador
2. **Configuração**: Acesse `config.html` para personalizar
3. **Documentação**: Clique no botão ❓ para ver a documentação

## 📝 **Convenções**

- **Arquivos HTML**: Páginas principais da aplicação
- **Pasta `assets/`**: Recursos estáticos (CSS, imagens, ícones)
- **Pasta `js/`**: Scripts JavaScript organizados por funcionalidade
- **Pasta `components/`**: Componentes HTML reutilizáveis
- **Pasta `docs/`**: Documentação técnica

---

*Estrutura otimizada para manutenibilidade e escalabilidade* 🎯 