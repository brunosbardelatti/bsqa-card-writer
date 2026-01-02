// QA-Toolbox - Script Principal
// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // ABA: TEXTO - Contadores
    // ============================================
    const textInputCounters = document.getElementById('textInputCounters');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');
    const byteCount = document.getElementById('byteCount');

    function atualizarContadores() {
        const texto = textInputCounters.value;
        
        // Contagem de caracteres
        const caracteres = texto.length;
        charCount.textContent = `Caracteres: ${caracteres}`;
        
        // Contagem de palavras (remove espaços extras e divide por espaços)
        const palavras = texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;
        wordCount.textContent = `Palavras: ${palavras}`;
        
        // Contagem de linhas
        const linhas = texto === '' ? 0 : texto.split('\n').length;
        lineCount.textContent = `Linhas: ${linhas}`;
        
        // Contagem de bytes (usando TextEncoder para UTF-8)
        const encoder = new TextEncoder();
        const bytes = encoder.encode(texto).length;
        byteCount.textContent = `Bytes: ${bytes}`;
    }

    // Atualiza contadores em tempo real
    textInputCounters.addEventListener('input', atualizarContadores);

    // ============================================
    // ABA: TEXTO - Conversores de Case
    // ============================================
    const textInputCase = document.getElementById('textInputCase');
    const btnUppercase = document.getElementById('btnUppercase');
    const btnLowercase = document.getElementById('btnLowercase');
    const btnTitlecase = document.getElementById('btnTitlecase');
    const btnCopyText = document.getElementById('btnCopyText');
    const btnClearText = document.getElementById('btnClearText');

    // Converte para MAIÚSCULAS
    btnUppercase.addEventListener('click', function() {
        textInputCase.value = textInputCase.value.toUpperCase();
    });

    // Converte para minúsculas
    btnLowercase.addEventListener('click', function() {
        textInputCase.value = textInputCase.value.toLowerCase();
    });

    // Converte para Primeira Letra Maiúscula (Title Case)
    btnTitlecase.addEventListener('click', function() {
        const texto = textInputCase.value.toLowerCase();
        const textoFormatado = texto.replace(/\b\w/g, function(letra) {
            return letra.toUpperCase();
        });
        textInputCase.value = textoFormatado;
    });

    // Copiar texto
    btnCopyText.addEventListener('click', function() {
        textInputCase.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnCopyText);
    });

    // Limpar texto
    btnClearText.addEventListener('click', function() {
        textInputCase.value = '';
    });

    // ============================================
    // ABA: ENCODERS/DECODERS - Base64
    // ============================================
    const base64Input = document.getElementById('base64Input');
    const base64Output = document.getElementById('base64Output');
    const btnBase64Encode = document.getElementById('btnBase64Encode');
    const btnBase64Decode = document.getElementById('btnBase64Decode');
    const btnBase64Swap = document.getElementById('btnBase64Swap');

    // Encode Base64
    btnBase64Encode.addEventListener('click', function() {
        try {
            const texto = base64Input.value;
            const codificado = btoa(unescape(encodeURIComponent(texto)));
            base64Output.value = codificado;
        } catch (erro) {
            alert('Erro ao codificar: ' + erro.message);
        }
    });

    // Decode Base64
    btnBase64Decode.addEventListener('click', function() {
        try {
            const codificado = base64Input.value.trim();
            const decodificado = decodeURIComponent(escape(atob(codificado)));
            base64Output.value = decodificado;
        } catch (erro) {
            alert('Erro ao decodificar. Verifique se o texto é um Base64 válido.');
        }
    });

    // Trocar (Swap) campos Base64
    btnBase64Swap.addEventListener('click', function() {
        const temp = base64Input.value;
        base64Input.value = base64Output.value;
        base64Output.value = temp;
    });

    // Copiar Input Base64
    const btnBase64CopyInput = document.getElementById('btnBase64CopyInput');
    btnBase64CopyInput.addEventListener('click', function() {
        base64Input.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnBase64CopyInput);
    });

    // Copiar Output Base64
    const btnBase64CopyOutput = document.getElementById('btnBase64CopyOutput');
    btnBase64CopyOutput.addEventListener('click', function() {
        base64Output.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnBase64CopyOutput);
    });

    // Limpar campos Base64
    const btnBase64Clear = document.getElementById('btnBase64Clear');
    btnBase64Clear.addEventListener('click', function() {
        base64Input.value = '';
        base64Output.value = '';
    });

    // ============================================
    // ABA: ENCODERS/DECODERS - URL
    // ============================================
    const urlInput = document.getElementById('urlInput');
    const urlOutput = document.getElementById('urlOutput');
    const btnUrlEncode = document.getElementById('btnUrlEncode');
    const btnUrlDecode = document.getElementById('btnUrlDecode');

    // Encode URL
    btnUrlEncode.addEventListener('click', function() {
        try {
            const texto = urlInput.value;
            const codificado = encodeURIComponent(texto);
            urlOutput.value = codificado;
        } catch (erro) {
            alert('Erro ao codificar: ' + erro.message);
        }
    });

    // Decode URL
    btnUrlDecode.addEventListener('click', function() {
        try {
            const codificado = urlInput.value;
            const decodificado = decodeURIComponent(codificado);
            urlOutput.value = decodificado;
        } catch (erro) {
            alert('Erro ao decodificar. Verifique se o texto é uma URL codificada válida.');
        }
    });

    // Copiar Input URL
    const btnUrlCopyInput = document.getElementById('btnUrlCopyInput');
    btnUrlCopyInput.addEventListener('click', function() {
        urlInput.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnUrlCopyInput);
    });

    // Copiar Output URL
    const btnUrlCopyOutput = document.getElementById('btnUrlCopyOutput');
    btnUrlCopyOutput.addEventListener('click', function() {
        urlOutput.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnUrlCopyOutput);
    });

    // Limpar campos URL
    const btnUrlClear = document.getElementById('btnUrlClear');
    btnUrlClear.addEventListener('click', function() {
        urlInput.value = '';
        urlOutput.value = '';
    });

    // ============================================
    // ABA: FORMATADORES - JSON
    // ============================================
    const jsonInput = document.getElementById('jsonInput');
    const btnJsonPrettify = document.getElementById('btnJsonPrettify');
    const btnJsonMinify = document.getElementById('btnJsonMinify');
    const btnJsonCopy = document.getElementById('btnJsonCopy');
    const btnJsonClear = document.getElementById('btnJsonClear');
    const jsonAlertContainer = document.getElementById('jsonAlertContainer');

    function mostrarAlertaJson(mensagem) {
        jsonAlertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Remove o alerta após 5 segundos
        setTimeout(function() {
            const alerta = jsonAlertContainer.querySelector('.alert');
            if (alerta) {
                alerta.remove();
            }
        }, 5000);
    }

    // Prettify / Formatar JSON
    btnJsonPrettify.addEventListener('click', function() {
        try {
            const jsonTexto = jsonInput.value.trim();
            if (jsonTexto === '') {
                mostrarAlertaJson('Por favor, insira um JSON válido.');
                return;
            }
            
            const objetoJson = JSON.parse(jsonTexto);
            const jsonFormatado = JSON.stringify(objetoJson, null, 2);
            jsonInput.value = jsonFormatado;
            
            // Remove alertas anteriores se houver
            jsonAlertContainer.innerHTML = '';
        } catch (erro) {
            mostrarAlertaJson('JSON inválido! Verifique a sintaxe do JSON.');
        }
    });

    // Minify / Compactar JSON
    btnJsonMinify.addEventListener('click', function() {
        try {
            const jsonTexto = jsonInput.value.trim();
            if (jsonTexto === '') {
                mostrarAlertaJson('Por favor, insira um JSON válido.');
                return;
            }
            
            const objetoJson = JSON.parse(jsonTexto);
            const jsonCompactado = JSON.stringify(objetoJson);
            jsonInput.value = jsonCompactado;
            
            // Remove alertas anteriores se houver
            jsonAlertContainer.innerHTML = '';
        } catch (erro) {
            mostrarAlertaJson('JSON inválido! Verifique a sintaxe do JSON.');
        }
    });

    // Copiar JSON
    btnJsonCopy.addEventListener('click', function() {
        jsonInput.select();
        document.execCommand('copy');
        mostrarFeedbackCopiar(btnJsonCopy);
    });

    // Limpar JSON
    btnJsonClear.addEventListener('click', function() {
        jsonInput.value = '';
        jsonAlertContainer.innerHTML = '';
    });

    // ============================================
    // ABA: GERADORES DE DADOS - CPF
    // ============================================
    const cpfOutput = document.getElementById('cpfOutput');
    const btnGenerateCpf = document.getElementById('btnGenerateCpf');
    const btnCopyCpf = document.getElementById('btnCopyCpf');

    // Função para calcular dígito verificador do CPF
    function calcularDigitoCPF(cpf, posicao) {
        let soma = 0;
        let peso = posicao + 1;
        
        for (let i = 0; i < posicao; i++) {
            soma += parseInt(cpf[i]) * peso;
            peso--;
        }
        
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    // Função para gerar CPF válido
    function generateCPF() {
        // Gera 9 dígitos aleatórios
        let cpf = '';
        for (let i = 0; i < 9; i++) {
            cpf += Math.floor(Math.random() * 10).toString();
        }
        
        // Calcula primeiro dígito verificador
        const digito1 = calcularDigitoCPF(cpf, 9);
        cpf += digito1.toString();
        
        // Calcula segundo dígito verificador
        const digito2 = calcularDigitoCPF(cpf, 10);
        cpf += digito2.toString();
        
        // Aplica máscara XXX.XXX.XXX-XX
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Gerar CPF
    btnGenerateCpf.addEventListener('click', function() {
        cpfOutput.value = generateCPF();
    });

    // Copiar CPF
    btnCopyCpf.addEventListener('click', function() {
        if (cpfOutput.value) {
            cpfOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyCpf);
        }
    });

    // ============================================
    // ABA: GERADORES DE DADOS - CNPJ
    // ============================================
    const cnpjOutput = document.getElementById('cnpjOutput');
    const btnGenerateCnpj = document.getElementById('btnGenerateCnpj');
    const btnCopyCnpj = document.getElementById('btnCopyCnpj');

    // Função para calcular dígito verificador do CNPJ
    function calcularDigitoCNPJ(cnpj, posicao) {
        const pesos = posicao === 12 
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        let soma = 0;
        for (let i = 0; i < posicao; i++) {
            soma += parseInt(cnpj[i]) * pesos[i];
        }
        
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    // Função para gerar CNPJ válido
    function generateCNPJ() {
        // Gera 12 dígitos aleatórios
        let cnpj = '';
        for (let i = 0; i < 12; i++) {
            cnpj += Math.floor(Math.random() * 10).toString();
        }
        
        // Calcula primeiro dígito verificador
        const digito1 = calcularDigitoCNPJ(cnpj, 12);
        cnpj += digito1.toString();
        
        // Calcula segundo dígito verificador
        const digito2 = calcularDigitoCNPJ(cnpj, 13);
        cnpj += digito2.toString();
        
        // Aplica máscara XX.XXX.XXX/XXXX-XX
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    // Gerar CNPJ
    btnGenerateCnpj.addEventListener('click', function() {
        cnpjOutput.value = generateCNPJ();
    });

    // Copiar CNPJ
    btnCopyCnpj.addEventListener('click', function() {
        if (cnpjOutput.value) {
            cnpjOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyCnpj);
        }
    });

    // ============================================
    // ABA: GERADORES DE DADOS EXPANDIDOS
    // ============================================
    
    // Gerador Email
    const emailOutput = document.getElementById('emailOutput');
    const btnGenerateEmail = document.getElementById('btnGenerateEmail');
    const btnCopyEmail = document.getElementById('btnCopyEmail');

    function generateEmail() {
        const nomes = ['usuario', 'teste', 'admin', 'cliente', 'vendedor', 'suporte', 'dev', 'qa'];
        const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'exemplo.com', 'teste.com.br', 'empresa.com'];
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const numero = Math.floor(Math.random() * 9999);
        const dominio = dominios[Math.floor(Math.random() * dominios.length)];
        return `${nome}${numero}@${dominio}`;
    }

    btnGenerateEmail.addEventListener('click', function() {
        emailOutput.value = generateEmail();
    });

    btnCopyEmail.addEventListener('click', function() {
        if (emailOutput.value) {
            emailOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyEmail);
        }
    });

    // Gerador Telefone
    const telefoneOutput = document.getElementById('telefoneOutput');
    const btnGenerateTelefone = document.getElementById('btnGenerateTelefone');
    const btnCopyTelefone = document.getElementById('btnCopyTelefone');

    function generateTelefone() {
        const ddd = Math.floor(Math.random() * 90) + 10; // DDD entre 10 e 99
        const numero = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
        return `(${ddd}) ${numero.toString().substring(0, 5)}-${numero.toString().substring(5)}`;
    }

    btnGenerateTelefone.addEventListener('click', function() {
        telefoneOutput.value = generateTelefone();
    });

    btnCopyTelefone.addEventListener('click', function() {
        if (telefoneOutput.value) {
            telefoneOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyTelefone);
        }
    });

    // Gerador Data/Hora
    const dataOutput = document.getElementById('dataOutput');
    const btnGenerateDataBR = document.getElementById('btnGenerateDataBR');
    const btnGenerateDataISO = document.getElementById('btnGenerateDataISO');
    const btnGenerateTimestamp = document.getElementById('btnGenerateTimestamp');
    const btnCopyData = document.getElementById('btnCopyData');

    btnGenerateDataBR.addEventListener('click', function() {
        const data = new Date();
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const minuto = String(data.getMinutes()).padStart(2, '0');
        dataOutput.value = `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    });

    btnGenerateDataISO.addEventListener('click', function() {
        const data = new Date();
        dataOutput.value = data.toISOString();
    });

    btnGenerateTimestamp.addEventListener('click', function() {
        dataOutput.value = Math.floor(Date.now() / 1000).toString();
    });

    btnCopyData.addEventListener('click', function() {
        if (dataOutput.value) {
            dataOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyData);
        }
    });

    // Gerador UUID
    const uuidOutput = document.getElementById('uuidOutput');
    const btnGenerateUuid = document.getElementById('btnGenerateUuid');
    const btnCopyUuid = document.getElementById('btnCopyUuid');

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    btnGenerateUuid.addEventListener('click', function() {
        uuidOutput.value = generateUUID();
    });

    btnCopyUuid.addEventListener('click', function() {
        if (uuidOutput.value) {
            uuidOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyUuid);
        }
    });

    // Gerador CEP
    const cepOutput = document.getElementById('cepOutput');
    const btnGenerateCep = document.getElementById('btnGenerateCep');
    const btnCopyCep = document.getElementById('btnCopyCep');

    function generateCEP() {
        const cep = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
        return cep.toString().replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    btnGenerateCep.addEventListener('click', function() {
        cepOutput.value = generateCEP();
    });

    btnCopyCep.addEventListener('click', function() {
        if (cepOutput.value) {
            cepOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyCep);
        }
    });

    // Gerador Nome Completo
    const nomeOutput = document.getElementById('nomeOutput');
    const btnGenerateNome = document.getElementById('btnGenerateNome');
    const btnCopyNome = document.getElementById('btnCopyNome');

    const primeirosNomes = ['Maria', 'João', 'Ana', 'Pedro', 'Julia', 'Carlos', 'Fernanda', 'Ricardo', 'Patricia', 'Lucas'];
    const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima'];

    function generateNome() {
        const primeiroNome = primeirosNomes[Math.floor(Math.random() * primeirosNomes.length)];
        const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        return `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
    }

    btnGenerateNome.addEventListener('click', function() {
        nomeOutput.value = generateNome();
    });

    btnCopyNome.addEventListener('click', function() {
        if (nomeOutput.value) {
            nomeOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyNome);
        }
    });

    // Função auxiliar para feedback de copiar
    function mostrarFeedbackCopiar(botao) {
        const textoOriginal = botao.textContent;
        const classesOriginais = Array.from(botao.classList);
        
        botao.textContent = '✓ Copiado!';
        botao.className = 'btn btn-success';
        
        setTimeout(function() {
            botao.textContent = textoOriginal;
            botao.className = classesOriginais.join(' ');
        }, 1500);
    }

    // ============================================  
// ABA: GERADORES COMPLETOS  
// ============================================
  
// ============================================  
// DADOS BASE PARA GERADORES  
// ============================================  
const dadosBase = {  
    nomesMasculinos: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno', 'Gustavo', 'Rodrigo', 'Thiago',   
                      'Matheus', 'Leonardo', 'Daniel', 'André', 'Fernando', 'Marcelo', 'Ricardo', 'Paulo', 'Carlos', 'Diego'],  
    nomesFemininos: ['Maria', 'Ana', 'Julia', 'Beatriz', 'Larissa', 'Fernanda', 'Patricia', 'Camila', 'Amanda', 'Juliana',  
                     'Mariana', 'Gabriela', 'Carolina', 'Bruna', 'Leticia', 'Vanessa', 'Priscila', 'Renata', 'Aline', 'Bianca'],  
    sobrenomes: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',  
                 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes',  
                 'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moreira', 'Cavalcanti', 'Dias', 'Castro', 'Campos', 'Cardoso'],  
    logradouros: ['Rua das Flores', 'Avenida Paulista', 'Rua Augusta', 'Alameda Santos', 'Rua Consolação',   
                  'Avenida Brasil', 'Rua XV de Novembro', 'Praça da Sé', 'Rua Direita', 'Avenida Independência',  
                  'Rua Sete de Setembro', 'Travessa do Comércio', 'Rua Barão de Itapetininga', 'Avenida Ipiranga',  
                  'Rua Oscar Freire', 'Avenida Rebouças', 'Rua Haddock Lobo', 'Alameda Jaú', 'Rua Estados Unidos'],  
    bairros: ['Centro', 'Jardim Paulista', 'Vila Mariana', 'Mooca', 'Pinheiros', 'Brooklin', 'Santana', 'Ipiranga',  
              'Tatuapé', 'Vila Prudente', 'Lapa', 'Butantã', 'Saúde', 'Perdizes', 'Bela Vista', 'Liberdade'],  
    cidades: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre', 'Salvador',  
              'Fortaleza', 'Recife', 'Manaus', 'Belém', 'Goiânia', 'Campinas', 'São Luís', 'Florianópolis'],  
    estados: {  
        'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Belo Horizonte': 'MG', 'Brasília': 'DF', 'Curitiba': 'PR',  
        'Porto Alegre': 'RS', 'Salvador': 'BA', 'Fortaleza': 'CE', 'Recife': 'PE', 'Manaus': 'AM',  
        'Belém': 'PA', 'Goiânia': 'GO', 'Campinas': 'SP', 'São Luís': 'MA', 'Florianópolis': 'SC'  
    },  
    complementos: ['Apto 101', 'Apto 205', 'Casa', 'Sala 301', 'Bloco A', 'Bloco B', 'Fundos', 'Sobrado', 'Cobertura', ''],  
    tiposEmpresa: ['Comércio', 'Serviços', 'Indústria', 'Tecnologia', 'Consultoria', 'Logística', 'Alimentação', 'Saúde'],  
    sufixosEmpresa: ['Ltda', 'EIRELI', 'S.A.', 'ME', 'EPP'],  
    portes: ['MEI', 'Microempresa', 'Pequeno Porte', 'Médio Porte', 'Grande Porte'],  
    cnaes: [  
        '4711-3/02 - Comércio varejista',  
        '6201-5/00 - Desenvolvimento de software',  
        '7020-4/00 - Consultoria empresarial',  
        '5611-2/01 - Restaurantes e similares',  
        '8630-5/03 - Atividade médica ambulatorial',  
        '4120-4/00 - Construção de edifícios',  
        '5310-5/01 - Atividades de Correio',  
        '8599-6/04 - Treinamento em desenvolvimento profissional'  
    ]  
};
  
// ============================================  
// FUNÇÕES AUXILIARES REUTILIZÁVEIS  
// ============================================
  
function randomItem(array) {  
    return array[Math.floor(Math.random() * array.length)];  
}
  
function randomNumber(min, max) {  
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}
  
function gerarDataAleatoria(idadeMin, idadeMax) {  
    const hoje = new Date();  
    const anoNascimento = hoje.getFullYear() - randomNumber(idadeMin, idadeMax);  
    const mes = String(randomNumber(1, 12)).padStart(2, '0');  
    const dia = String(randomNumber(1, 28)).padStart(2, '0');  
    return `${dia}/${mes}/${anoNascimento}`;  
}
  
function gerarDataAberturaEmpresa() {  
    const anoAbertura = randomNumber(1990, 2023);  
    const mes = String(randomNumber(1, 12)).padStart(2, '0');  
    const dia = String(randomNumber(1, 28)).padStart(2, '0');  
    return `${dia}/${mes}/${anoAbertura}`;  
}
  
function gerarRG() {  
    const numero = randomNumber(10000000, 99999999);  
    const digito = randomNumber(0, 9);  
    return `${numero.toString().substring(0, 2)}.${numero.toString().substring(2, 5)}.${numero.toString().substring(5, 8)}-${digito}`;  
}
  
function gerarInscricaoEstadual() {  
    let ie = '';  
    for (let i = 0; i < 9; i++) {  
        ie += randomNumber(0, 9);  
    }  
    return ie.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');  
}
  
function gerarTelefoneFixo() {  
    const ddd = randomNumber(11, 99);  
    const prefixo = randomNumber(2000, 5999);  
    const sufixo = randomNumber(1000, 9999);  
    return `(${ddd}) ${prefixo}-${sufixo}`;  
}
  
function gerarCelular() {  
    const ddd = randomNumber(11, 99);  
    const prefixo = randomNumber(90000, 99999);  
    const sufixo = randomNumber(1000, 9999);  
    return `(${ddd}) ${prefixo}-${sufixo}`;  
}
  
function gerarEmailPF(nome) {  
    const nomeFormatado = nome.toLowerCase()  
        .normalize('NFD')  
        .replace(/[\u0300-\u036f]/g, '')  
        .replace(/\s+/g, '.');  
    const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com', 'email.com'];  
    return `${nomeFormatado}${randomNumber(1, 999)}@${randomItem(dominios)}`;  
}
  
function gerarEmailPJ(nomeFantasia) {  
    const nomeFormatado = nomeFantasia.toLowerCase()  
        .normalize('NFD')  
        .replace(/[\u0300-\u036f]/g, '')  
        .replace(/\s+/g, '')  
        .replace(/[^a-z0-9]/g, '');  
    const dominios = ['contato', 'comercial', 'vendas', 'atendimento', 'sac'];  
    return `${randomItem(dominios)}@${nomeFormatado}.com.br`;  
}
  
// Reutilizando funções existentes  
function calcularDigitoCPF(cpf, posicao) {  
    let soma = 0;  
    let peso = posicao + 1;
      
    for (let i = 0; i < posicao; i++) {  
        soma += parseInt(cpf[i]) * peso;  
        peso--;  
    }
      
    const resto = soma % 11;  
    return resto < 2 ? 0 : 11 - resto;  
}
  
function gerarCPFValido() {  
    let cpf = '';  
    for (let i = 0; i < 9; i++) {  
        cpf += Math.floor(Math.random() * 10).toString();  
    }
      
    const digito1 = calcularDigitoCPF(cpf, 9);  
    cpf += digito1.toString();
      
    const digito2 = calcularDigitoCPF(cpf, 10);  
    cpf += digito2.toString();
      
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');  
}
  
function calcularDigitoCNPJ(cnpj, posicao) {  
    const pesos = posicao === 12   
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]  
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      
    let soma = 0;  
    for (let i = 0; i < posicao; i++) {  
        soma += parseInt(cnpj[i]) * pesos[i];  
    }
      
    const resto = soma % 11;  
    return resto < 2 ? 0 : 11 - resto;  
}
  
function gerarCNPJValido() {  
    let cnpj = '';  
    for (let i = 0; i < 12; i++) {  
        cnpj += Math.floor(Math.random() * 10).toString();  
    }
      
    const digito1 = calcularDigitoCNPJ(cnpj, 12);  
    cnpj += digito1.toString();
      
    const digito2 = calcularDigitoCNPJ(cnpj, 13);  
    cnpj += digito2.toString();
      
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');  
}
  
function gerarCEPValido() {  
    const cep = randomNumber(10000000, 99999999);  
    return cep.toString().replace(/(\d{5})(\d{3})/, '$1-$2');  
}
  
// ============================================  
// GERADOR DE PESSOA FÍSICA COMPLETA  
// ============================================
  
function gerarPessoaFisica() {  
    const genero = Math.random() > 0.5 ? 'M' : 'F';  
    const primeiroNome = genero === 'M'   
        ? randomItem(dadosBase.nomesMasculinos)   
        : randomItem(dadosBase.nomesFemininos);  
    const sobrenome1 = randomItem(dadosBase.sobrenomes);  
    const sobrenome2 = randomItem(dadosBase.sobrenomes);  
    const nomeCompleto = `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
      
    const nomeMae = `${randomItem(dadosBase.nomesFemininos)} ${randomItem(dadosBase.sobrenomes)} ${randomItem(dadosBase.sobrenomes)}`;  
    const nomePai = `${randomItem(dadosBase.nomesMasculinos)} ${randomItem(dadosBase.sobrenomes)} ${randomItem(dadosBase.sobrenomes)}`;
      
    const cidade = randomItem(dadosBase.cidades);  
    const uf = dadosBase.estados[cidade];
      
    return {  
        nome: nomeCompleto,  
        cpf: gerarCPFValido(),  
        rg: gerarRG(),  
        dataNascimento: gerarDataAleatoria(18, 80),  
        email: gerarEmailPF(nomeCompleto),  
        telefone: gerarTelefoneFixo(),  
        celular: gerarCelular(),  
        cep: gerarCEPValido(),  
        endereco: randomItem(dadosBase.logradouros),  
        numero: randomNumber(1, 9999).toString(),  
        complemento: randomItem(dadosBase.complementos),  
        bairro: randomItem(dadosBase.bairros),  
        cidade: cidade,  
        uf: uf,  
        nomeMae: nomeMae,  
        nomePai: nomePai  
    };  
}
  
// ============================================  
// GERADOR DE PESSOA JURÍDICA COMPLETA  
// ============================================
  
function gerarPessoaJuridica() {  
    const tipoEmpresa = randomItem(dadosBase.tiposEmpresa);  
    const sufixo = randomItem(dadosBase.sufixosEmpresa);  
    const nomeBase = randomItem(dadosBase.sobrenomes);  
    const razaoSocial = `${nomeBase} ${tipoEmpresa} ${sufixo}`;  
    const nomeFantasia = `${nomeBase} ${tipoEmpresa}`;
      
    const responsavel = `${randomItem(dadosBase.nomesMasculinos)} ${randomItem(dadosBase.sobrenomes)}`;  
    const cidade = randomItem(dadosBase.cidades);  
    const uf = dadosBase.estados[cidade];
      
    return {  
        razaoSocial: razaoSocial,  
        nomeFantasia: nomeFantasia,  
        cnpj: gerarCNPJValido(),  
        inscricaoEstadual: gerarInscricaoEstadual(),  
        dataAbertura: gerarDataAberturaEmpresa(),  
        porte: randomItem(dadosBase.portes),  
        email: gerarEmailPJ(nomeFantasia),  
        telefone: gerarTelefoneFixo(),  
        cep: gerarCEPValido(),  
        cnae: randomItem(dadosBase.cnaes),  
        endereco: randomItem(dadosBase.logradouros),  
        numero: randomNumber(1, 9999).toString(),  
        complemento: randomItem(['Sala 101', 'Sala 205', 'Galpão 1', 'Loja A', 'Andar 3', '']),  
        bairro: randomItem(dadosBase.bairros),  
        cidade: cidade,  
        uf: uf,  
        responsavel: responsavel,  
        cpfResponsavel: gerarCPFValido()  
    };  
}
  
// ============================================  
// EVENT LISTENERS - PESSOA FÍSICA  
// ============================================
  
document.getElementById('btnGerarPF').addEventListener('click', function() {  
    const pf = gerarPessoaFisica();
      
    document.getElementById('pfNome').value = pf.nome;  
    document.getElementById('pfCpf').value = pf.cpf;  
    document.getElementById('pfRg').value = pf.rg;  
    document.getElementById('pfDataNascimento').value = pf.dataNascimento;  
    document.getElementById('pfEmail').value = pf.email;  
    document.getElementById('pfTelefone').value = pf.telefone;  
    document.getElementById('pfCelular').value = pf.celular;  
    document.getElementById('pfCep').value = pf.cep;  
    document.getElementById('pfEndereco').value = pf.endereco;  
    document.getElementById('pfNumero').value = pf.numero;  
    document.getElementById('pfComplemento').value = pf.complemento;  
    document.getElementById('pfBairro').value = pf.bairro;  
    document.getElementById('pfCidade').value = pf.cidade;  
    document.getElementById('pfUf').value = pf.uf;  
    document.getElementById('pfNomeMae').value = pf.nomeMae;  
    document.getElementById('pfNomePai').value = pf.nomePai;  
});
  
document.getElementById('btnCopiarPF').addEventListener('click', function() {  
    const pf = {  
        'Nome Completo': document.getElementById('pfNome').value,  
        'CPF': document.getElementById('pfCpf').value,  
        'RG': document.getElementById('pfRg').value,  
        'Data de Nascimento': document.getElementById('pfDataNascimento').value,  
        'Email': document.getElementById('pfEmail').value,  
        'Telefone': document.getElementById('pfTelefone').value,  
        'Celular': document.getElementById('pfCelular').value,  
        'CEP': document.getElementById('pfCep').value,  
        'Endereço': document.getElementById('pfEndereco').value,  
        'Número': document.getElementById('pfNumero').value,  
        'Complemento': document.getElementById('pfComplemento').value,  
        'Bairro': document.getElementById('pfBairro').value,  
        'Cidade': document.getElementById('pfCidade').value,  
        'UF': document.getElementById('pfUf').value,  
        'Nome da Mãe': document.getElementById('pfNomeMae').value,  
        'Nome do Pai': document.getElementById('pfNomePai').value  
    };
      
    let texto = '=== PESSOA FÍSICA ===\n\n';  
    for (const [chave, valor] of Object.entries(pf)) {  
        if (valor) texto += `${chave}: ${valor}\n`;  
    }
      
    navigator.clipboard.writeText(texto).then(() => {  
        mostrarFeedbackBotao(document.getElementById('btnCopiarPF'), 'Copiado!');  
    });  
});
  
document.getElementById('btnCopiarPFJson').addEventListener('click', function() {  
    const pf = {  
        nome: document.getElementById('pfNome').value,  
        cpf: document.getElementById('pfCpf').value,  
        rg: document.getElementById('pfRg').value,  
        dataNascimento: document.getElementById('pfDataNascimento').value,  
        email: document.getElementById('pfEmail').value,  
        telefone: document.getElementById('pfTelefone').value,  
        celular: document.getElementById('pfCelular').value,  
        endereco: {  
            cep: document.getElementById('pfCep').value,  
            logradouro: document.getElementById('pfEndereco').value,  
            numero: document.getElementById('pfNumero').value,  
            complemento: document.getElementById('pfComplemento').value,  
            bairro: document.getElementById('pfBairro').value,  
            cidade: document.getElementById('pfCidade').value,  
            uf: document.getElementById('pfUf').value  
        },  
        filiacao: {  
            mae: document.getElementById('pfNomeMae').value,  
            pai: document.getElementById('pfNomePai').value  
        }  
    };
      
    const json = JSON.stringify(pf, null, 2);  
    navigator.clipboard.writeText(json).then(() => {  
        mostrarFeedbackBotao(document.getElementById('btnCopiarPFJson'), 'JSON Copiado!');  
    });  
});
  
// ============================================  
// EVENT LISTENERS - PESSOA JURÍDICA  
// ============================================
  
document.getElementById('btnGerarPJ').addEventListener('click', function() {  
    const pj = gerarPessoaJuridica();
      
    document.getElementById('pjRazaoSocial').value = pj.razaoSocial;  
    document.getElementById('pjNomeFantasia').value = pj.nomeFantasia;  
    document.getElementById('pjCnpj').value = pj.cnpj;  
    document.getElementById('pjInscricaoEstadual').value = pj.inscricaoEstadual;  
    document.getElementById('pjDataAbertura').value = pj.dataAbertura;  
    document.getElementById('pjPorte').value = pj.porte;  
    document.getElementById('pjEmail').value = pj.email;  
    document.getElementById('pjTelefone').value = pj.telefone;  
    document.getElementById('pjCep').value = pj.cep;  
    document.getElementById('pjCnae').value = pj.cnae;  
    document.getElementById('pjEndereco').value = pj.endereco;  
    document.getElementById('pjNumero').value = pj.numero;  
    document.getElementById('pjComplemento').value = pj.complemento;  
    document.getElementById('pjBairro').value = pj.bairro;  
    document.getElementById('pjCidade').value = pj.cidade;  
    document.getElementById('pjUf').value = pj.uf;  
    document.getElementById('pjResponsavel').value = pj.responsavel;  
    document.getElementById('pjCpfResponsavel').value = pj.cpfResponsavel;  
});
  
document.getElementById('btnCopiarPJ').addEventListener('click', function() {  
    const pj = {  
        'Razão Social': document.getElementById('pjRazaoSocial').value,  
        'Nome Fantasia': document.getElementById('pjNomeFantasia').value,  
        'CNPJ': document.getElementById('pjCnpj').value,  
        'Inscrição Estadual': document.getElementById('pjInscricaoEstadual').value,  
        'Data de Abertura': document.getElementById('pjDataAbertura').value,  
        'Porte': document.getElementById('pjPorte').value,  
        'Email': document.getElementById('pjEmail').value,  
        'Telefone': document.getElementById('pjTelefone').value,  
        'CEP': document.getElementById('pjCep').value,  
        'CNAE': document.getElementById('pjCnae').value,  
        'Endereço': document.getElementById('pjEndereco').value,  
        'Número': document.getElementById('pjNumero').value,  
        'Complemento': document.getElementById('pjComplemento').value,  
        'Bairro': document.getElementById('pjBairro').value,  
        'Cidade': document.getElementById('pjCidade').value,  
        'UF': document.getElementById('pjUf').value,  
        'Responsável Legal': document.getElementById('pjResponsavel').value,  
        'CPF do Responsável': document.getElementById('pjCpfResponsavel').value  
    };
      
    let texto = '=== PESSOA JURÍDICA ===\n\n';  
    for (const [chave, valor] of Object.entries(pj)) {  
        if (valor) texto += `${chave}: ${valor}\n`;  
    }
      
    navigator.clipboard.writeText(texto).then(() => {  
        mostrarFeedbackBotao(document.getElementById('btnCopiarPJ'), 'Copiado!');  
    });  
});
  
document.getElementById('btnCopiarPJJson').addEventListener('click', function() {  
    const pj = {  
        razaoSocial: document.getElementById('pjRazaoSocial').value,  
        nomeFantasia: document.getElementById('pjNomeFantasia').value,  
        cnpj: document.getElementById('pjCnpj').value,  
        inscricaoEstadual: document.getElementById('pjInscricaoEstadual').value,  
        dataAbertura: document.getElementById('pjDataAbertura').value,  
        porte: document.getElementById('pjPorte').value,  
        email: document.getElementById('pjEmail').value,  
        telefone: document.getElementById('pjTelefone').value,  
        cnae: document.getElementById('pjCnae').value,  
        endereco: {  
            cep: document.getElementById('pjCep').value,  
            logradouro: document.getElementById('pjEndereco').value,  
            numero: document.getElementById('pjNumero').value,  
            complemento: document.getElementById('pjComplemento').value,  
            bairro: document.getElementById('pjBairro').value,  
            cidade: document.getElementById('pjCidade').value,  
            uf: document.getElementById('pjUf').value  
        },  
        responsavel: {  
            nome: document.getElementById('pjResponsavel').value,  
            cpf: document.getElementById('pjCpfResponsavel').value  
        }  
    };
      
    const json = JSON.stringify(pj, null, 2);  
    navigator.clipboard.writeText(json).then(() => {  
        mostrarFeedbackBotao(document.getElementById('btnCopiarPJJson'), 'JSON Copiado!');  
    });  
});
  
// ============================================  
// FUNÇÃO AUXILIAR PARA FEEDBACK  
// ============================================
  
function mostrarFeedbackBotao(botao, mensagem) {  
    const textoOriginal = botao.innerHTML;  
    const classesOriginais = Array.from(botao.classList);
      
    botao.innerHTML = '✓ ' + mensagem;  
    botao.className = 'btn btn-success';
      
    setTimeout(function() {  
        botao.innerHTML = textoOriginal;  
        botao.className = classesOriginais.join(' ');  
    }, 1500);  
}  

    // ============================================
    // ABA: COMPARADOR DE TEXTOS/JSON
    // ============================================
    const comparadorTexto1 = document.getElementById('comparadorTexto1');
    const comparadorTexto2 = document.getElementById('comparadorTexto2');
    const btnComparar = document.getElementById('btnComparar');
    const btnLimparComparador = document.getElementById('btnLimparComparador');
    const comparadorResultado = document.getElementById('comparadorResultado');

    function compararTextos(texto1, texto2) {
        const linhas1 = texto1.split('\n');
        const linhas2 = texto2.split('\n');
        const maxLinhas = Math.max(linhas1.length, linhas2.length);
        
        let html = '<div class="card"><div class="card-body"><h5 class="card-title">Resultado da Comparação</h5>';
        html += '<div class="table-responsive"><table class="table table-sm table-bordered">';
        html += '<thead><tr><th style="width: 5%">Linha</th><th style="width: 47.5%">Texto 1</th><th style="width: 47.5%">Texto 2</th></tr></thead><tbody>';
        
        let diferencas = 0;
        for (let i = 0; i < maxLinhas; i++) {
            const linha1 = linhas1[i] || '';
            const linha2 = linhas2[i] || '';
            const saoIguais = linha1 === linha2;
            
            if (!saoIguais) {
                diferencas++;
            }
            
            const classeLinha = saoIguais ? '' : 'table-warning';
            html += `<tr class="${classeLinha}">`;
            html += `<td>${i + 1}</td>`;
            html += `<td><code class="${saoIguais ? '' : 'text-danger'}">${escapeHtml(linha1)}</code></td>`;
            html += `<td><code class="${saoIguais ? '' : 'text-danger'}">${escapeHtml(linha2)}</code></td>`;
            html += '</tr>';
        }
        
        html += '</tbody></table></div>';
        
        if (diferencas === 0) {
            html += '<div class="alert alert-success mt-3">✓ Os textos são idênticos!</div>';
        } else {
            html += `<div class="alert alert-warning mt-3">⚠ Foram encontradas ${diferencas} linha(s) diferente(s).</div>`;
        }
        
        html += '</div></div>';
        return html;
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    btnComparar.addEventListener('click', function() {
        const texto1 = comparadorTexto1.value;
        const texto2 = comparadorTexto2.value;
        
        if (!texto1 && !texto2) {
            comparadorResultado.innerHTML = '<div class="alert alert-info">Por favor, insira textos para comparar.</div>';
            return;
        }
        
        comparadorResultado.innerHTML = compararTextos(texto1, texto2);
    });

    btnLimparComparador.addEventListener('click', function() {
        comparadorTexto1.value = '';
        comparadorTexto2.value = '';
        comparadorResultado.innerHTML = '';
    });

    // ============================================
    // ABA: JWT DECODER
    // ============================================
    const jwtInput = document.getElementById('jwtInput');
    const btnDecodificarJwt = document.getElementById('btnDecodificarJwt');
    const jwtResultado = document.getElementById('jwtResultado');

    function base64UrlDecode(str) {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
            base64 += new Array(5 - pad).join('=');
        }
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            return null;
        }
    }

    btnDecodificarJwt.addEventListener('click', function() {
        const token = jwtInput.value.trim();
        
        if (!token) {
            jwtResultado.innerHTML = '<div class="alert alert-warning">Por favor, insira um token JWT.</div>';
            return;
        }
        
        const partes = token.split('.');
        if (partes.length !== 3) {
            jwtResultado.innerHTML = '<div class="alert alert-danger">Token JWT inválido. Um JWT deve ter 3 partes separadas por ponto.</div>';
            return;
        }
        
        try {
            const header = base64UrlDecode(partes[0]);
            const payload = base64UrlDecode(partes[1]);
            const signature = partes[2];
            
            if (!header || !payload) {
                jwtResultado.innerHTML = '<div class="alert alert-danger">Erro ao decodificar o token JWT.</div>';
                return;
            }
            
            let html = '<div class="card"><div class="card-body">';
            html += '<h5 class="card-title">Token JWT Decodificado</h5>';
            
            // Header
            html += '<div class="mb-3"><h6>Header:</h6>';
            html += '<pre class="bg-light p-3 rounded"><code>' + escapeHtml(JSON.stringify(JSON.parse(header), null, 2)) + '</code></pre></div>';
            
            // Payload
            html += '<div class="mb-3"><h6>Payload:</h6>';
            const payloadObj = JSON.parse(payload);
            html += '<pre class="bg-light p-3 rounded"><code>' + escapeHtml(JSON.stringify(payloadObj, null, 2)) + '</code></pre></div>';
            
            // Verificar expiração
            if (payloadObj.exp) {
                const expDate = new Date(payloadObj.exp * 1000);
                const agora = new Date();
                const expirado = agora > expDate;
                html += `<div class="alert ${expirado ? 'alert-danger' : 'alert-success'}">`;
                html += `Token ${expirado ? 'EXPIRADO' : 'VÁLIDO'} - Expira em: ${expDate.toLocaleString('pt-BR')}`;
                html += '</div>';
            }
            
            // Signature (apenas mostrar que existe)
            html += '<div class="mb-3"><h6>Signature:</h6>';
            html += '<pre class="bg-light p-3 rounded"><code>' + signature.substring(0, 50) + '...</code></pre></div>';
            
            html += '</div></div>';
            jwtResultado.innerHTML = html;
        } catch (erro) {
            jwtResultado.innerHTML = '<div class="alert alert-danger">Erro ao processar o token JWT: ' + erro.message + '</div>';
        }
    });

    // ============================================
    // ABA: HASH GENERATOR
    // ============================================
    const hashInput = document.getElementById('hashInput');
    const hashOutput = document.getElementById('hashOutput');
    const btnHashMD5 = document.getElementById('btnHashMD5');
    const btnHashSHA256 = document.getElementById('btnHashSHA256');
    const btnHashSHA512 = document.getElementById('btnHashSHA512');
    const btnCopyHash = document.getElementById('btnCopyHash');

    // MD5 usando Crypto-JS (biblioteca externa via CDN)
    async function gerarHashMD5(texto) {
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.MD5(texto).toString();
        } else {
            return 'Erro: Biblioteca Crypto-JS não carregada.';
        }
    }

    async function gerarHashSHA256(texto) {
        const encoder = new TextEncoder();
        const data = encoder.encode(texto);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function gerarHashSHA512(texto) {
        const encoder = new TextEncoder();
        const data = encoder.encode(texto);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    btnHashMD5.addEventListener('click', async function() {
        const texto = hashInput.value;
        if (!texto) {
            hashOutput.value = 'Por favor, insira um texto para gerar o hash.';
            return;
        }
        hashOutput.value = await gerarHashMD5(texto);
    });

    btnHashSHA256.addEventListener('click', async function() {
        const texto = hashInput.value;
        if (!texto) {
            hashOutput.value = 'Por favor, insira um texto para gerar o hash.';
            return;
        }
        hashOutput.value = await gerarHashSHA256(texto);
    });

    btnHashSHA512.addEventListener('click', async function() {
        const texto = hashInput.value;
        if (!texto) {
            hashOutput.value = 'Por favor, insira um texto para gerar o hash.';
            return;
        }
        hashOutput.value = await gerarHashSHA512(texto);
    });

    btnCopyHash.addEventListener('click', function() {
        if (hashOutput.value) {
            hashOutput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopyHash);
        }
    });

    // ============================================
    // ABA: REGEX TESTER
    // ============================================
    const regexPattern = document.getElementById('regexPattern');
    const regexTestText = document.getElementById('regexTestText');
    const regexFlagG = document.getElementById('regexFlagG');
    const regexFlagI = document.getElementById('regexFlagI');
    const regexFlagM = document.getElementById('regexFlagM');
    const btnTestarRegex = document.getElementById('btnTestarRegex');
    const regexResultado = document.getElementById('regexResultado');

    btnTestarRegex.addEventListener('click', function() {
        const pattern = regexPattern.value.trim();
        const texto = regexTestText.value;
        
        if (!pattern) {
            regexResultado.innerHTML = '<div class="alert alert-warning">Por favor, insira uma expressão regular.</div>';
            return;
        }
        
        try {
            // Construir flags
            let flags = '';
            if (regexFlagG.checked) flags += 'g';
            if (regexFlagI.checked) flags += 'i';
            if (regexFlagM.checked) flags += 'm';
            
            const regex = new RegExp(pattern, flags);
            const matches = texto.match(regex);
            const todasMatches = [];
            let match;
            const regexGlobal = new RegExp(pattern, flags + 'g');
            
            // Resetar regex para buscar todas as ocorrências
            regexGlobal.lastIndex = 0;
            while ((match = regexGlobal.exec(texto)) !== null) {
                todasMatches.push({
                    texto: match[0],
                    index: match.index,
                    grupos: match.slice(1)
                });
            }
            
            let html = '<div class="card"><div class="card-body">';
            html += '<h5 class="card-title">Resultado do Teste Regex</h5>';
            
            if (todasMatches.length === 0) {
                let dica = '';
                // Verificar se a regex usa âncoras de início/fim
                if (pattern.startsWith('^') || pattern.endsWith('$')) {
                    dica = '<div class="alert alert-info mt-2"><small><strong>💡 Dica:</strong> Sua regex usa âncoras <code>^</code> (início) ou <code>$</code> (fim). Isso significa que ela só encontra correspondências quando o padrão é a string inteira. Para encontrar padrões no meio do texto, remova essas âncoras.</small></div>';
                }
                html += '<div class="alert alert-warning">Nenhuma correspondência encontrada.</div>' + dica;
            } else {
                html += `<div class="alert alert-success">Encontradas ${todasMatches.length} correspondência(s).</div>`;
                html += '<div class="table-responsive"><table class="table table-sm table-bordered">';
                html += '<thead><tr><th>#</th><th>Correspondência</th><th>Posição</th><th>Grupos</th></tr></thead><tbody>';
                
                todasMatches.forEach((match, index) => {
                    html += '<tr>';
                    html += `<td>${index + 1}</td>`;
                    html += `<td><code>${escapeHtml(match.texto)}</code></td>`;
                    html += `<td>${match.index}</td>`;
                    html += `<td>${match.grupos.length > 0 ? match.grupos.map((g, i) => `Grupo ${i + 1}: <code>${escapeHtml(g || '')}</code>`).join('<br>') : '-'}</td>`;
                    html += '</tr>';
                });
                
                html += '</tbody></table></div>';
                
                // Mostrar texto com highlights
                let textoHighlight = escapeHtml(texto);
                todasMatches.reverse().forEach(match => {
                    const inicio = match.index;
                    const fim = inicio + match.texto.length;
                    textoHighlight = textoHighlight.substring(0, inicio) + 
                                   '<mark>' + textoHighlight.substring(inicio, fim) + '</mark>' + 
                                   textoHighlight.substring(fim);
                });
                
                html += '<div class="mt-3"><h6>Texto com correspondências destacadas:</h6>';
                html += `<div class="bg-light p-3 rounded"><pre style="white-space: pre-wrap; word-wrap: break-word;">${textoHighlight}</pre></div></div>`;
            }
            
            html += '</div></div>';
            regexResultado.innerHTML = html;
        } catch (erro) {
            regexResultado.innerHTML = '<div class="alert alert-danger">Erro na expressão regular: ' + escapeHtml(erro.message) + '</div>';
        }
    });

    // ============================================  
    // ABA: FERRAMENTAS cURL  
    // ============================================
    
    // ============================================  
    // PARSER DE cURL  
    // ============================================
    
    function parseCurl(curlCommand) {  
        try {  
            // Remove quebras de linha e espaços extras  
            let cmd = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Remove 'curl' do início  
            cmd = cmd.replace(/^curl\s+/i, '');
            
            const result = {  
                method: 'GET',  
                url: '',  
                headers: {},  
                body: null  
            };
            
            // Extrai método HTTP
            // Procura por -X ou --request seguido do método (com ou sem aspas)
            let methodMatch = cmd.match(/(?:-X|--request)[\s=]+['"]?(\w+)['"]?/i);
            if (!methodMatch) {
                // Tenta também com espaços extras ou quebras de linha
                methodMatch = cmd.match(/(?:-X|--request)[\s=]+(\w+)/i);
            }
            if (methodMatch) {
                result.method = methodMatch[1].toUpperCase();
            } else {
                // Se não encontrou método explícito, verifica se há body
                // Se houver body (-d ou --data) e não houver --get, assume POST
                const hasBody = /(?:-d|--data|--data-raw|--data-binary|--data-ascii)/i.test(cmd);
                const hasGetFlag = /--get/i.test(cmd);
                
                if (hasBody && !hasGetFlag) {
                    // Se tem body e não tem --get, provavelmente é POST
                    result.method = 'POST';
                }
                // Caso contrário, mantém GET como padrão
            }
            
            // Extrai URL - procura especificamente por URLs (http:// ou https://)
            // Isso garante que flags como --location, -L, -v, etc. não sejam confundidas com URLs
            let urlMatch = null;
            
            // Primeiro tenta encontrar URL entre aspas (simples ou duplas)
            // Procura por aspas contendo https:// ou http://
            urlMatch = cmd.match(/['"](https?:\/\/[^'"]+)['"]/i);
            if (!urlMatch) {
                // Se não encontrou entre aspas, procura diretamente por http:// ou https://
                // Para no primeiro espaço, quebra de linha ou flag (que começa com -)
                urlMatch = cmd.match(/(https?:\/\/[^\s'"]+)/i);
            }
            
            if (urlMatch) {
                result.url = urlMatch[1] || urlMatch[0];
                // Remove aspas do início e fim se houver (caso a regex tenha capturado)
                result.url = result.url.replace(/^['"]+|['"]+$/g, '');
                // Remove espaços extras
                result.url = result.url.trim();
            }
            
            // Extrai headers  
            const headerRegex = /-H\s+['"]([^'"]+)['"]/gi;  
            let headerMatch;  
            while ((headerMatch = headerRegex.exec(cmd)) !== null) {  
                const header = headerMatch[1];  
                const colonIndex = header.indexOf(':');  
                if (colonIndex > -1) {  
                    const key = header.substring(0, colonIndex).trim();  
                    const value = header.substring(colonIndex + 1).trim();  
                    result.headers[key] = value;  
                }  
            }
            
            // Extrai body (-d, --data, --data-raw, --data-binary, --data-ascii)
            // Procura por flags de data seguidas de conteúdo
            let bodyMatch = null;
            
            // Primeiro tenta com aspas simples
            bodyMatch = cmd.match(/(?:-d|--data|--data-raw|--data-binary|--data-ascii)\s+'([^']+)'/i);
            if (!bodyMatch) {
                // Tenta com aspas duplas
                bodyMatch = cmd.match(/(?:-d|--data|--data-raw|--data-binary|--data-ascii)\s+"([^"]+)"/i);
            }
            if (!bodyMatch) {
                // Tenta sem aspas (para dados simples até o próximo espaço ou flag)
                bodyMatch = cmd.match(/(?:-d|--data|--data-raw|--data-binary|--data-ascii)\s+([^\s-]+)/i);
            }
            
            if (bodyMatch) {
                result.body = bodyMatch[1];
                // Remove espaços extras no início e fim
                result.body = result.body.trim();
                // Tenta fazer parse se for JSON  
                try {  
                    result.body = JSON.parse(result.body);  
                } catch (e) {  
                    // Mantém como string se não for JSON válido  
                }  
            }
            
            return result;  
        } catch (error) {  
            throw new Error('Erro ao fazer parse do cURL: ' + error.message);  
        }  
    }
    
    // ============================================  
    // VALIDAR cURL  
    // ============================================
    
    document.getElementById('btnValidarCurl').addEventListener('click', function() {  
        const curlInput = document.getElementById('curlInput').value.trim();  
        const errorArea = document.getElementById('curlErrorArea');  
        const infoArea = document.getElementById('curlInfoArea');
        
        // Esconde áreas  
        document.getElementById('curlResponseArea').style.display = 'none';  
        document.getElementById('curlConversaoArea').style.display = 'none';  
        errorArea.style.display = 'none';
        
        if (!curlInput) {  
            errorArea.style.display = 'block';  
            document.getElementById('curlErrorMessage').textContent = 'Por favor, cole um comando cURL.';  
            return;  
        }
        
        try {  
            const parsed = parseCurl(curlInput);
            
            if (!parsed.url) {  
                throw new Error('URL não encontrada no comando cURL.');  
            }
            
            // Mostra informações extraídas  
            document.getElementById('curlMetodo').textContent = parsed.method;  
            document.getElementById('curlUrl').textContent = parsed.url;  
            document.getElementById('curlHeadersCount').textContent = Object.keys(parsed.headers).length + ' header(s)';  
            document.getElementById('curlBodyStatus').textContent = parsed.body ? 'Presente' : 'Ausente';
            
            infoArea.style.display = 'block';
            
            // Feedback sucesso  
            mostrarToast('✓ cURL válido! Estrutura OK.', 'success');
            
        } catch (error) {  
            errorArea.style.display = 'block';  
            document.getElementById('curlErrorMessage').textContent = error.message;  
        }  
    });
    
    // ============================================  
    // EXECUTAR cURL  
    // ============================================  
    
    // Função auxiliar para detectar erro de CORS
    function isCorsError(error) {
        const errorMsg = error.message.toLowerCase();
        return errorMsg.includes('cors') || 
               errorMsg.includes('failed to fetch') || 
               errorMsg.includes('networkerror') ||
               errorMsg.includes('network error') ||
               error.name === 'TypeError' && errorMsg.includes('fetch');
    }
    
    // Função auxiliar para usar proxy CORS
    function usarProxyCors(url) {
        // Remove protocolo se já tiver proxy
        if (url.includes('allorigins.win') || url.includes('corsproxy.io') || url.includes('cors-anywhere')) {
            return url;
        }
        
        // Usa allorigins.win como proxy (gratuito e confiável)
        // Formato: https://api.allorigins.win/raw?url=ENCODED_URL
        const encodedUrl = encodeURIComponent(url);
        return `https://api.allorigins.win/raw?url=${encodedUrl}`;
    }
    
    document.getElementById('btnExecutarCurl').addEventListener('click', async function() {  
        const curlInput = document.getElementById('curlInput').value.trim();  
        const errorArea = document.getElementById('curlErrorArea');  
        const responseArea = document.getElementById('curlResponseArea');  
        const btnExecutar = this;  
        const usarProxy = document.getElementById('usarProxyCors').checked;
        
        errorArea.style.display = 'none';  
        document.getElementById('curlConversaoArea').style.display = 'none';
        
        if (!curlInput) {  
            errorArea.style.display = 'block';  
            document.getElementById('curlErrorMessage').textContent = 'Por favor, cole um comando cURL.';  
            return;  
        }
        
        try {  
            const parsed = parseCurl(curlInput);
            
            if (!parsed.url) {  
                throw new Error('URL não encontrada no comando cURL.');  
            }
            
            // Desabilita botão durante execução  
            btnExecutar.disabled = true;  
            btnExecutar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Executando...';
            
            // Marca tempo inicial  
            const startTime = performance.now();
            
            // Determina URL final (com ou sem proxy)
            let urlFinal = parsed.url;
            if (usarProxy) {
                urlFinal = usarProxyCors(parsed.url);
            }
            
            // Prepara opções do fetch  
            const options = {  
                method: parsed.method,  
                headers: parsed.headers  
            };
            
            // Remove headers que podem causar problemas com proxy
            if (usarProxy) {
                // Remove headers de host e origin que podem interferir
                delete options.headers['host'];
                delete options.headers['Host'];
                delete options.headers['origin'];
                delete options.headers['Origin'];
            }
            
            // Adiciona body se não for GET  
            if (parsed.method !== 'GET' && parsed.body) {  
                options.body = typeof parsed.body === 'string' ? parsed.body : JSON.stringify(parsed.body);  
            }
            
            // Executa request  
            let response;
            let tentouComProxy = usarProxy;
            try {
                response = await fetch(urlFinal, options);
            } catch (fetchError) {
                // Se der erro e não estava usando proxy, tenta com proxy automaticamente
                if (!tentouComProxy && isCorsError(fetchError)) {
                    urlFinal = usarProxyCors(parsed.url);
                    // Remove headers que podem causar problemas com proxy
                    delete options.headers['host'];
                    delete options.headers['Host'];
                    delete options.headers['origin'];
                    delete options.headers['Origin'];
                    tentouComProxy = true;
                    response = await fetch(urlFinal, options);
                } else {
                    throw fetchError;
                }
            }
            
            // Calcula tempo  
            const endTime = performance.now();  
            const duration = (endTime - startTime).toFixed(2);
            
            // Extrai body
            let responseBody;
            let contentType = '';
            
            try {
                // Tenta obter content-type do header
                contentType = response.headers.get('content-type') || '';
                
                // Tenta parsear como JSON primeiro
                const textBody = await response.text();
                try {
                    responseBody = JSON.parse(textBody);
                    responseBody = JSON.stringify(responseBody, null, 2);
                    contentType = 'application/json';
                } catch {
                    // Se não for JSON, usa o texto
                    responseBody = textBody;
                }
            } catch (bodyError) {
                responseBody = 'Erro ao ler body da resposta: ' + bodyError.message;
            }
            
            // Extrai headers da response  
            const responseHeaders = {};  
            response.headers.forEach((value, key) => {  
                responseHeaders[key] = value;  
            });
            
            // Mostra resultado  
            const statusBadge = document.getElementById('responseStatus');  
            statusBadge.textContent = `${response.status} ${response.statusText}`;  
            statusBadge.className = 'badge ' + (response.ok ? 'bg-success' : 'bg-danger');
            
            document.getElementById('responseTime').textContent = `⏱️ ${duration}ms`;  
            document.getElementById('responseHeadersContent').textContent = JSON.stringify(responseHeaders, null, 2);  
            document.getElementById('curlResponse').value = responseBody;
            
            responseArea.style.display = 'block';
            
            // Mostra aviso se usou proxy
            if (tentouComProxy || urlFinal.includes('allorigins.win')) {
                mostrarToast('✓ Request executada com sucesso! (via proxy CORS)', 'success');
            } else {
                mostrarToast('✓ Request executada com sucesso!', 'success');
            }
            
        } catch (error) {  
            errorArea.style.display = 'block';  
            
            let mensagemErro = 'Erro ao executar request: ' + error.message;
            
            // Detecta erro de CORS e fornece instruções
            if (isCorsError(error)) {
                mensagemErro += '\n\n⚠️ ERRO DE CORS DETECTADO\n\n';
                mensagemErro += 'Soluções possíveis:\n';
                mensagemErro += '1. ✅ Ative a opção "Usar Proxy CORS" acima e tente novamente\n';
                mensagemErro += '2. 🔧 Use uma extensão de navegador (ex: CORS Unblock, CORS Toggle)\n';
                mensagemErro += '3. 🌐 Configure um proxy CORS local (cors-anywhere)\n';
                mensagemErro += '4. 🔐 Se você controla a API, adicione CORS headers no servidor\n';
                mensagemErro += '\nNota: O proxy CORS público pode ter limitações de taxa e não é recomendado para produção.';
            }
            
            document.getElementById('curlErrorMessage').textContent = mensagemErro;
        } finally {  
            // Reabilita botão  
            btnExecutar.disabled = false;  
            btnExecutar.innerHTML = '▶️ Executar Request';  
        }  
    });
    
    // ============================================  
    // CONVERTER cURL  
    // ============================================
    
    document.getElementById('btnConverterCurl').addEventListener('click', function() {  
        const curlInput = document.getElementById('curlInput').value.trim();  
        const errorArea = document.getElementById('curlErrorArea');  
        const conversaoArea = document.getElementById('curlConversaoArea');
        
        errorArea.style.display = 'none';
        
        if (!curlInput) {  
            errorArea.style.display = 'block';  
            document.getElementById('curlErrorMessage').textContent = 'Por favor, cole um comando cURL.';  
            return;  
        }
        
        try {  
            const parsed = parseCurl(curlInput);
            
            if (!parsed.url) {  
                throw new Error('URL não encontrada no comando cURL.');  
            }
            
            // Gera código Fetch  
            const fetchCode = gerarCodigoFetch(parsed);  
            document.getElementById('fetchOutput').value = fetchCode;
            
            // Gera código Axios  
            const axiosCode = gerarCodigoAxios(parsed);  
            document.getElementById('axiosOutput').value = axiosCode;
            
            // Gera código XHR  
            const xhrCode = gerarCodigoXHR(parsed);  
            document.getElementById('xhrOutput').value = xhrCode;
            
            // Gera código Node.js  
            const nodejsCode = gerarCodigoNodeJS(parsed);  
            document.getElementById('nodejsOutput').value = nodejsCode;
            
            // Gera código Playwright  
            const playwrightCode = gerarCodigoPlaywright(parsed);  
            document.getElementById('playwrightOutput').value = playwrightCode;
            
            // Gera código Robot Framework  
            const robotCode = gerarCodigoRobotFramework(parsed);  
            document.getElementById('robotOutput').value = robotCode;
            
            conversaoArea.style.display = 'block';
            
            mostrarToast('✓ cURL convertido com sucesso!', 'success');
            
        } catch (error) {  
            errorArea.style.display = 'block';  
            document.getElementById('curlErrorMessage').textContent = error.message;  
        }  
    });
    
    function gerarCodigoFetch(parsed) {  
        const headersStr = Object.keys(parsed.headers).length > 0  
            ? ',\n  headers: ' + JSON.stringify(parsed.headers, null, 4).replace(/\n/g, '\n  ')  
            : '';
        
        const bodyStr = parsed.body && parsed.method !== 'GET'  
            ? ',\n  body: ' + (typeof parsed.body === 'string'   
                ? `'${parsed.body}'`   
                : JSON.stringify(parsed.body, null, 4).replace(/\n/g, '\n  '))  
            : '';
        
        return `fetch('${parsed.url}', {  
    method: '${parsed.method}'${headersStr}${bodyStr}  
    })  
    .then(response => response.json())  
    .then(data => console.log(data))  
    .catch(error => console.error('Error:', error));`;  
    }
    
    function gerarCodigoAxios(parsed) {  
        const headersStr = Object.keys(parsed.headers).length > 0  
            ? ',\n  headers: ' + JSON.stringify(parsed.headers, null, 4).replace(/\n/g, '\n  ')  
            : '';
        
        const bodyStr = parsed.body && parsed.method !== 'GET'  
            ? ',\n  data: ' + (typeof parsed.body === 'string'   
                ? `'${parsed.body}'`   
                : JSON.stringify(parsed.body, null, 4).replace(/\n/g, '\n  '))  
            : '';
        
        return `axios({  
    method: '${parsed.method.toLowerCase()}',  
    url: '${parsed.url}'${headersStr}${bodyStr}  
    })  
    .then(response => console.log(response.data))  
    .catch(error => console.error('Error:', error));`;  
    }
    
    function gerarCodigoXHR(parsed) {  
        let code = `const xhr = new XMLHttpRequest();  
    xhr.open('${parsed.method}', '${parsed.url}', true);
    
    `;
        
        // Headers  
        if (Object.keys(parsed.headers).length > 0) {  
            for (const [key, value] of Object.entries(parsed.headers)) {  
                code += `xhr.setRequestHeader('${key}', '${value}');\n`;  
            }  
            code += '\n';  
        }
        
        // Callbacks  
        code += `xhr.onload = function() {  
    if (xhr.status >= 200 && xhr.status < 300) {  
        console.log('Response:', xhr.responseText);  
    } else {  
        console.error('Error:', xhr.status, xhr.statusText);  
    }  
    };
    
    xhr.onerror = function() {  
    console.error('Request failed');  
    };
    
    `;
        
        // Send  
        if (parsed.body && parsed.method !== 'GET') {  
            const bodyStr = typeof parsed.body === 'string'   
                ? parsed.body   
                : JSON.stringify(parsed.body);  
            code += `xhr.send('${bodyStr}');`;  
        } else {  
            code += `xhr.send();`;  
        }
        
        return code;  
    }
    
    function gerarCodigoNodeJS(parsed) {
        // Opção 1: Usando fetch nativo (Node.js 18+)
        const headersStr = Object.keys(parsed.headers).length > 0  
            ? ',\n  headers: ' + JSON.stringify(parsed.headers, null, 4).replace(/\n/g, '\n  ')  
            : '';
        
        const bodyStr = parsed.body && parsed.method !== 'GET'  
            ? ',\n  body: ' + (typeof parsed.body === 'string'   
                ? `'${parsed.body.replace(/'/g, "\\'")}'`   
                : JSON.stringify(parsed.body, null, 4).replace(/\n/g, '\n  '))  
            : '';
        
        // Gera código usando fetch (Node.js 18+) e fallback para axios
        let code = `// Opção 1: Usando fetch nativo (Node.js 18+)\n`;
        code += `const response = await fetch('${parsed.url}', {\n  method: '${parsed.method}'${headersStr}${bodyStr}\n});\n\n`;
        code += `const data = await response.json();\nconsole.log(data);\n\n`;
        
        // Opção 2: Axios
        const axiosHeadersStr = Object.keys(parsed.headers).length > 0  
            ? ',\n  headers: ' + JSON.stringify(parsed.headers, null, 6).replace(/\n/g, '\n  ')  
            : '';
        const axiosDataStr = parsed.body && parsed.method !== 'GET'  
            ? ',\n  data: ' + (typeof parsed.body === 'string'   
                ? `'${parsed.body.replace(/'/g, "\\'")}'`   
                : JSON.stringify(parsed.body, null, 6).replace(/\n/g, '\n  '))  
            : '';
        
        code += `// Opção 2: Usando axios (npm install axios)\n`;
        code += `// const axios = require('axios');\n`;
        code += `// const response = await axios({\n`;
        code += `//   method: '${parsed.method.toLowerCase()}',\n`;
        code += `//   url: '${parsed.url}'${axiosHeadersStr}${axiosDataStr}\n`;
        code += `// });\n`;
        code += `// console.log(response.data);`;
        
        return code;
    }
    
    function gerarCodigoPlaywright(parsed) {
        const headersStr = Object.keys(parsed.headers).length > 0  
            ? ',\n      headers: ' + JSON.stringify(parsed.headers, null, 8).replace(/\n/g, '\n      ')  
            : '';
        
        const bodyStr = parsed.body && parsed.method !== 'GET'  
            ? ',\n      data: ' + (typeof parsed.body === 'string'   
                ? `'${parsed.body.replace(/'/g, "\\'")}'`   
                : JSON.stringify(parsed.body, null, 8).replace(/\n/g, '\n      '))  
            : '';
        
        let code = `const { test, expect } = require('@playwright/test');\n\ntest('API Request', async ({ request }) => {\n  const response = await request.${parsed.method.toLowerCase()}('${parsed.url}'${headersStr}${bodyStr});\n  \n  expect(response.ok()).toBeTruthy();\n  \n  const responseBody = await response.json();\n  console.log('Response:', responseBody);\n  \n  // Adicione suas asserções aqui\n  // expect(responseBody).toHaveProperty('key', 'value');\n});`;
        
        return code;
    }
    
    function gerarCodigoRobotFramework(parsed) {
        // Extrai base URL e endpoint
        let baseUrl = '';
        let endpoint = '';
        try {
            const urlObj = new URL(parsed.url);
            baseUrl = urlObj.protocol + '//' + urlObj.host;
            endpoint = urlObj.pathname + urlObj.search;
        } catch {
            baseUrl = parsed.url;
            endpoint = '/';
        }
        
        // Prepara headers
        let headersVar = '';
        let headersStr = '';
        if (Object.keys(parsed.headers).length > 0) {
            // Converte headers para formato Robot Framework (dicionário Python)
            // Formato: &{HEADERS}    key1=value1    key2=value2
            const headersList = Object.entries(parsed.headers)
                .map(([k, v]) => k + '=' + v.replace(/=/g, '\\='))
                .join('    ');
            headersVar = '&{HEADERS}    ' + headersList;
            headersStr = '    headers=${HEADERS}';
        }
        
        // Prepara body
        let bodyVar = '';
        let bodyStr = '';
        if (parsed.body && parsed.method !== 'GET') {
            if (typeof parsed.body === 'string') {
                // Tenta parsear como JSON, se não conseguir, usa como string
                try {
                    const jsonBody = JSON.parse(parsed.body);
                    bodyVar = '&{BODY}    ' + JSON.stringify(jsonBody);
                    bodyStr = '    json=${BODY}';
                } catch {
                    bodyVar = '${BODY}    ' + parsed.body.replace(/\$/g, '\\$');
                    bodyStr = '    data=${BODY}';
                }
            } else {
                bodyVar = '&{BODY}    ' + JSON.stringify(parsed.body);
                bodyStr = '    json=${BODY}';
            }
        }
        
        // Determina método HTTP em maiúsculas
        const methodUpper = parsed.method.toUpperCase();
        
        // Gera código Robot Framework
        let code = '*** Settings ***\n';
        code += 'Library    RequestsLibrary\n';
        code += 'Library    Collections\n\n';
        
        code += '*** Variables ***\n';
        code += '${BASE_URL}    ' + baseUrl + '\n';
        if (headersVar) {
            code += headersVar + '\n';
        }
        if (bodyVar) {
            code += bodyVar + '\n';
        }
        code += '\n';
        
        code += '*** Test Cases ***\n';
        code += 'API Request From cURL\n';
        code += '    Create Session    api    ${BASE_URL}\n';
        
        // Monta a linha de request
        code += '    ${response}=    ' + methodUpper + ' Request    api    ' + endpoint;
        if (bodyStr) {
            code += '\n    ...    ' + bodyStr.trim();
        }
        if (headersStr) {
            code += '\n    ...    ' + headersStr.trim();
        }
        code += '\n\n';
        
        code += '    Status Should Be    200    ${response}\n';
        code += '    ${json_response}=    Set Variable    ${response.json()}\n';
        code += '    Log    Response: ${json_response}\n';
        code += '    \n';
        code += '    # Adicione suas validações aqui\n';
        code += '    # Dictionary Should Contain Key    ${json_response}    key\n';
        code += '    # Should Be Equal    ${json_response[\'key\']}    expected_value';
        
        return code;
    }
    
    // ============================================  
    // FORMATAR RESPONSE JSON  
    // ============================================
    
    document.getElementById('btnFormatarResponse').addEventListener('click', function() {  
        const responseTextarea = document.getElementById('curlResponse');  
        const responseText = responseTextarea.value;
        
        try {  
            const parsed = JSON.parse(responseText);  
            responseTextarea.value = JSON.stringify(parsed, null, 2);  
            mostrarToast('✓ JSON formatado!', 'success');  
        } catch (error) {  
            mostrarToast('⚠️ Response não é um JSON válido', 'warning');  
        }  
    });
    
    // ============================================  
    // COPIAR RESPONSE  
    // ============================================
    
    document.getElementById('btnCopyResponse').addEventListener('click', function() {  
        const response = document.getElementById('curlResponse').value;  
        navigator.clipboard.writeText(response).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    // ============================================  
    // COPIAR CONVERSÕES  
    // ============================================
    
    document.getElementById('btnCopyFetch').addEventListener('click', function() {  
        const code = document.getElementById('fetchOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    document.getElementById('btnCopyAxios').addEventListener('click', function() {  
        const code = document.getElementById('axiosOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    document.getElementById('btnCopyXhr').addEventListener('click', function() {  
        const code = document.getElementById('xhrOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    document.getElementById('btnCopyNodejs').addEventListener('click', function() {  
        const code = document.getElementById('nodejsOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    document.getElementById('btnCopyPlaywright').addEventListener('click', function() {  
        const code = document.getElementById('playwrightOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    document.getElementById('btnCopyRobot').addEventListener('click', function() {  
        const code = document.getElementById('robotOutput').value;  
        navigator.clipboard.writeText(code).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    // ============================================  
    // LIMPAR cURL  
    // ============================================
    
    document.getElementById('btnLimparCurl').addEventListener('click', function() {  
        document.getElementById('curlInput').value = '';  
        document.getElementById('curlInfoArea').style.display = 'none';  
        document.getElementById('curlResponseArea').style.display = 'none';  
        document.getElementById('curlConversaoArea').style.display = 'none';  
        document.getElementById('curlErrorArea').style.display = 'none';  
    });
    
    // ============================================  
    // GERADOR DE cURL  
    // ============================================
    
    document.getElementById('btnGerarCurl').addEventListener('click', function() {  
        const metodo = document.getElementById('genMetodo').value;  
        const url = document.getElementById('genUrl').value.trim();  
        const headersText = document.getElementById('genHeaders').value.trim();  
        const body = document.getElementById('genBody').value.trim();
        
        if (!url) {  
            mostrarToast('⚠️ Por favor, informe a URL', 'warning');  
            return;  
        }
        
        let curl = `curl -X ${metodo} '${url}'`;
        
        // Adiciona headers  
        if (headersText) {  
            const headers = headersText.split('\n');  
            headers.forEach(header => {  
                const trimmed = header.trim();  
                if (trimmed) {  
                    curl += ` \\\n  -H '${trimmed}'`;  
                }  
            });  
        }
        
        // Adiciona body  
        if (body && metodo !== 'GET') {  
            // Escapa aspas simples no body  
            const escapedBody = body.replace(/'/g, "'\\''");  
            curl += ` \\\n  -d '${escapedBody}'`;  
        }
        
        document.getElementById('genCurlOutput').value = curl;  
        document.getElementById('genCurlOutputArea').style.display = 'block';
        
        mostrarToast('✓ cURL gerado com sucesso!', 'success');  
    });
    
    document.getElementById('btnCopyGenCurl').addEventListener('click', function() {  
        const curl = document.getElementById('genCurlOutput').value;  
        navigator.clipboard.writeText(curl).then(() => {  
            mostrarFeedbackBotao(this, 'Copiado!');  
        });  
    });
    
    // Limpar campos do gerador de cURL
    document.getElementById('btnLimparGenCurl').addEventListener('click', function() {
        document.getElementById('genMetodo').value = 'GET';
        document.getElementById('genUrl').value = '';
        document.getElementById('genHeaders').value = '';
        document.getElementById('genBody').value = '';
        document.getElementById('genCurlOutput').value = '';
        document.getElementById('genCurlOutputArea').style.display = 'none';
        mostrarToast('✓ Campos limpos!', 'success');
    });
    
    // ============================================  
    // FUNÇÃO AUXILIAR - TOAST  
    // ============================================
    
    function mostrarToast(mensagem, tipo = 'info') {  
        // Cria elemento de toast se não existir  
        let toastContainer = document.getElementById('toastContainer');  
        if (!toastContainer) {  
            toastContainer = document.createElement('div');  
            toastContainer.id = 'toastContainer';  
            toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';  
            document.body.appendChild(toastContainer);  
        }
        
        const toast = document.createElement('div');  
        toast.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`;  
        toast.style.cssText = 'min-width: 250px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';  
        toast.innerHTML = `  
            ${mensagem}  
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>  
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {  
            toast.remove();  
        }, 3000);  
    } 
    
    // ============================================    
    // ABA: VALIDADOR DE XML DOCUMENTOS FISCAIS    
    // ============================================
    
    // ============================================    
    // FUNÇÕES AUXILIARES - VALIDAÇÃO CPF/CNPJ    
    // ============================================
    
    function validarCPF(cpf) {
        if (!cpf) return false;
        
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais (CPF inválido)
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Valida primeiro dígito verificador
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        // Valida segundo dígito verificador
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }
    
    function validarCNPJ(cnpj) {
        if (!cnpj) return false;
        
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/[^\d]/g, '');
        
        // Verifica se tem 14 dígitos
        if (cnpj.length !== 14) return false;
        
        // Verifica se todos os dígitos são iguais (CNPJ inválido)
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Valida primeiro dígito verificador
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(0))) return false;
        
        // Valida segundo dígito verificador
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        
        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(1))) return false;
        
        return true;
    }
    
    // ============================================    
    // IDENTIFICADOR DE TIPO DE DOCUMENTO    
    // ============================================
    
    function identificarTipoDocumento(xmlDoc) {  
        // NFe - Nota Fiscal Eletrônica  
        if (xmlDoc.querySelector('nfeProc') || xmlDoc.querySelector('NFe')) {  
            const mod = xmlDoc.querySelector('ide mod')?.textContent;  
            return mod === '65' ? 'NFCe' : 'NFe';  
        }
        
        // CT-e - Conhecimento de Transporte Eletrônico  
        if (xmlDoc.querySelector('cteProc') || xmlDoc.querySelector('CTe')) {  
            return 'CTe';  
        }
        
        // MDF-e - Manifesto de Documentos Fiscais Eletrônico  
        if (xmlDoc.querySelector('mdfeProc') || xmlDoc.querySelector('MDFe')) {  
            return 'MDFe';  
        }
        
        // NFS-e - Nota Fiscal de Serviço Eletrônica  
        if (xmlDoc.querySelector('CompNfse') || xmlDoc.querySelector('Nfse')) {  
            return 'NFSe';  
        }
        
        // CF-e SAT - Cupom Fiscal Eletrônico SAT  
        if (xmlDoc.querySelector('CFe')) {  
            return 'CFeSAT';  
        }
        
        return 'DESCONHECIDO';  
    }
    
    // ============================================    
    // VALIDADOR UNIVERSAL DE XML FISCAL    
    // ============================================
    
    function validarXMLFiscal(xmlString) {  
        try {  
            const parser = new DOMParser();  
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            
            // Verifica erros de parsing  
            const parserError = xmlDoc.querySelector('parsererror');  
            if (parserError) {  
                throw new Error('XML malformado: ' + parserError.textContent);  
            }
            
            const result = {  
                valido: true,  
                tipo: null,  
                erros: [],  
                avisos: [],  
                dados: {}  
            };
            
            // Identifica tipo de documento  
            result.tipo = identificarTipoDocumento(xmlDoc);
            
            if (result.tipo === 'DESCONHECIDO') {  
                result.valido = false;  
                result.erros.push('Tipo de documento fiscal não identificado');  
                return result;  
            }
            
            // Redireciona para validador específico  
            switch (result.tipo) {  
                case 'NFe':  
                case 'NFCe':  
                    return validarNFe(xmlDoc, result);  
                case 'CTe':  
                    return validarCTe(xmlDoc, result);  
                case 'MDFe':  
                    return validarMDFe(xmlDoc, result);  
                case 'NFSe':  
                    return validarNFSe(xmlDoc, result);  
                case 'CFeSAT':  
                    return validarCFeSAT(xmlDoc, result);  
                default:  
                    result.valido = false;  
                    result.erros.push('Validador não implementado para este tipo');  
                    return result;  
            }
            
        } catch (error) {  
            return {  
                valido: false,  
                tipo: null,  
                erros: ['Erro ao processar XML: ' + error.message],  
                avisos: [],  
                dados: {}  
            };  
        }  
    }
    
    // ============================================    
    // VALIDADOR NFe/NFCe (código anterior mantido)  
    // ============================================
    
    function validarNFe(xmlDoc, result) {  
        const infNFe = xmlDoc.querySelector('infNFe');  
        if (!infNFe) {  
            result.valido = false;  
            result.erros.push('Tag <infNFe> não encontrada');  
            return result;  
        }
        
        result.dados = extrairDadosNFe(xmlDoc);  
        validarCamposObrigatoriosNFe(xmlDoc, result);  
        validarChaveAcesso(xmlDoc, result, 'NFe');  
        validarEmitente(xmlDoc, result);  
        validarDestinatario(xmlDoc, result);  
        validarProdutos(xmlDoc, result);  
        validarTotais(xmlDoc, result);  
        validarAssinatura(xmlDoc, result);
        
        result.valido = result.erros.length === 0;  
        return result;  
    }
    
    // ============================================    
    // EXTRAÇÃO DE DADOS NFe    
    // ============================================
    
    function extrairDadosNFe(xmlDoc) {
        const dados = {};
        
        // Chave de acesso
        const infNFe = xmlDoc.querySelector('infNFe');
        dados.chaveAcesso = infNFe?.getAttribute('Id')?.replace('NFe', '');
        
        // Dados da IDE
        const ide = xmlDoc.querySelector('ide');
        if (ide) {
            dados.numero = ide.querySelector('nNF')?.textContent;
            dados.serie = ide.querySelector('serie')?.textContent;
            dados.dataEmissao = ide.querySelector('dhEmi')?.textContent;
            dados.dataSaida = ide.querySelector('dhSaiEnt')?.textContent;
            dados.modelo = ide.querySelector('mod')?.textContent;
            dados.naturezaOperacao = ide.querySelector('natOp')?.textContent;
            dados.tipoOperacao = ide.querySelector('tpNF')?.textContent; // 0=Entrada, 1=Saída
            dados.tipoEmissao = ide.querySelector('tpEmis')?.textContent;
            dados.ambiente = ide.querySelector('tpAmb')?.textContent; // 1=Produção, 2=Homologação
            dados.finalidade = ide.querySelector('finNFe')?.textContent;
            dados.indicadorFinal = ide.querySelector('indFinal')?.textContent; // 0=Não, 1=Sim
            dados.indicadorPresenca = ide.querySelector('indPres')?.textContent;
        }
        
        // Emitente
        const emit = xmlDoc.querySelector('emit');
        if (emit) {
            dados.emitente = {
                cnpj: emit.querySelector('CNPJ')?.textContent,
                razaoSocial: emit.querySelector('xNome')?.textContent,
                nomeFantasia: emit.querySelector('xFant')?.textContent,
                ie: emit.querySelector('IE')?.textContent,
                crt: emit.querySelector('CRT')?.textContent,
                endereco: extrairEnderecoNFe(emit)
            };
        }
        
        // Destinatário
        const dest = xmlDoc.querySelector('dest');
        if (dest) {
            dados.destinatario = {
                cpf: dest.querySelector('CPF')?.textContent,
                cnpj: dest.querySelector('CNPJ')?.textContent,
                nome: dest.querySelector('xNome')?.textContent,
                ie: dest.querySelector('IE')?.textContent,
                endereco: extrairEnderecoNFe(dest)
            };
        }
        
        // Produtos
        const produtos = xmlDoc.querySelectorAll('det');
        dados.produtos = Array.from(produtos).map((det, index) => {
            const prod = det.querySelector('prod');
            const imposto = det.querySelector('imposto');
            return {
                item: det.getAttribute('nItem') || (index + 1).toString(),
                codigo: prod?.querySelector('cProd')?.textContent,
                ean: prod?.querySelector('cEAN')?.textContent,
                descricao: prod?.querySelector('xProd')?.textContent,
                ncm: prod?.querySelector('NCM')?.textContent,
                cest: prod?.querySelector('CEST')?.textContent,
                cfop: prod?.querySelector('CFOP')?.textContent,
                unidade: prod?.querySelector('uCom')?.textContent,
                quantidade: prod?.querySelector('qCom')?.textContent,
                valorUnitario: prod?.querySelector('vUnCom')?.textContent,
                valorTotal: prod?.querySelector('vProd')?.textContent,
                valorTributos: imposto?.querySelector('vTotTrib')?.textContent
            };
        });
        
        // Totais
        const total = xmlDoc.querySelector('total');
        if (total) {
            const icmsTot = total.querySelector('ICMSTot');
            if (icmsTot) {
                dados.totais = {
                    valorProdutos: icmsTot.querySelector('vProd')?.textContent,
                    valorFrete: icmsTot.querySelector('vFrete')?.textContent,
                    valorSeguro: icmsTot.querySelector('vSeg')?.textContent,
                    valorDesconto: icmsTot.querySelector('vDesc')?.textContent,
                    valorII: icmsTot.querySelector('vII')?.textContent,
                    valorIPI: icmsTot.querySelector('vIPI')?.textContent,
                    valorPIS: icmsTot.querySelector('vPIS')?.textContent,
                    valorCOFINS: icmsTot.querySelector('vCOFINS')?.textContent,
                    valorOutros: icmsTot.querySelector('vOutro')?.textContent,
                    valorNF: icmsTot.querySelector('vNF')?.textContent,
                    valorTributos: icmsTot.querySelector('vTotTrib')?.textContent
                };
            }
        }
        
        // Transporte
        const transp = xmlDoc.querySelector('transp');
        if (transp) {
            dados.transporte = {
                modalidadeFrete: transp.querySelector('modFrete')?.textContent,
                transportadora: null
            };
            
            const transporta = transp.querySelector('transporta');
            if (transporta) {
                dados.transporte.transportadora = {
                    cnpj: transporta.querySelector('CNPJ')?.textContent,
                    razaoSocial: transporta.querySelector('xNome')?.textContent,
                    ie: transporta.querySelector('IE')?.textContent,
                    endereco: transporta.querySelector('xEnder')?.textContent,
                    municipio: transporta.querySelector('xMun')?.textContent,
                    uf: transporta.querySelector('UF')?.textContent
                };
            }
        }
        
        // Pagamento
        const pag = xmlDoc.querySelector('pag');
        if (pag) {
            const detPag = pag.querySelector('detPag');
            if (detPag) {
                dados.pagamento = {
                    forma: detPag.querySelector('tPag')?.textContent,
                    valor: detPag.querySelector('vPag')?.textContent
                };
            }
        }
        
        // Protocolo de autorização
        const protNFe = xmlDoc.querySelector('protNFe infProt');
        if (protNFe) {
            dados.protocolo = {
                numero: protNFe.querySelector('nProt')?.textContent,
                dataAutorizacao: protNFe.querySelector('dhRecbto')?.textContent,
                status: protNFe.querySelector('cStat')?.textContent,
                motivo: protNFe.querySelector('xMotivo')?.textContent
            };
        }
        
        return dados;
    }
    
    function extrairEnderecoNFe(node) {
        const endereco = node.querySelector('enderEmit, enderDest');
        if (!endereco) return null;
        
        return {
            logradouro: endereco.querySelector('xLgr')?.textContent,
            numero: endereco.querySelector('nro')?.textContent,
            complemento: endereco.querySelector('xCpl')?.textContent,
            bairro: endereco.querySelector('xBairro')?.textContent,
            municipio: endereco.querySelector('xMun')?.textContent,
            uf: endereco.querySelector('UF')?.textContent,
            cep: endereco.querySelector('CEP')?.textContent,
            pais: endereco.querySelector('xPais')?.textContent
        };
    }
    
    // ============================================    
    // VALIDAÇÕES NFe    
    // ============================================
    
    function validarCamposObrigatoriosNFe(xmlDoc, result) {
        const camposObrigatorios = [
            { tag: 'ide', nome: 'Identificação da NFe' },
            { tag: 'emit', nome: 'Emitente' },
            { tag: 'dest', nome: 'Destinatário' },
            { tag: 'total', nome: 'Totais' }
        ];
        
        camposObrigatorios.forEach(campo => {
            if (!xmlDoc.querySelector(campo.tag)) {
                result.erros.push(`Campo obrigatório ausente: ${campo.nome} (<${campo.tag}>)`);
            }
        });
    }
    
    function validarEmitente(xmlDoc, result) {
        const emit = xmlDoc.querySelector('emit');
        if (!emit) return;
        
        const cnpj = emit.querySelector('CNPJ')?.textContent;
        const razaoSocial = emit.querySelector('xNome')?.textContent;
        const ie = emit.querySelector('IE')?.textContent;
        
        if (!cnpj) {
            result.erros.push('CNPJ do emitente não informado');
        } else if (!validarCNPJ(cnpj)) {
            result.erros.push('CNPJ do emitente inválido: ' + cnpj);
        }
        
        if (!razaoSocial || razaoSocial.trim().length < 2) {
            result.erros.push('Razão social do emitente inválida');
        }
        
        if (!ie) {
            result.avisos.push('Inscrição estadual do emitente não informada');
        }
    }
    
    function validarDestinatario(xmlDoc, result) {
        const dest = xmlDoc.querySelector('dest');
        if (!dest) {
            result.erros.push('Destinatário não informado');
            return;
        }
        
        const cnpj = dest.querySelector('CNPJ')?.textContent;
        const cpf = dest.querySelector('CPF')?.textContent;
        const nome = dest.querySelector('xNome')?.textContent;
        
        if (!cnpj && !cpf) {
            result.erros.push('CPF/CNPJ do destinatário não informado');
        } else if (cnpj && !validarCNPJ(cnpj)) {
            result.erros.push('CNPJ do destinatário inválido');
        } else if (cpf && !validarCPF(cpf)) {
            result.erros.push('CPF do destinatário inválido');
        }
        
        if (!nome) {
            result.erros.push('Nome do destinatário não informado');
        }
    }
    
    function validarProdutos(xmlDoc, result) {
        const produtos = xmlDoc.querySelectorAll('det');
        
        if (produtos.length === 0) {
            result.erros.push('Nenhum produto informado na NFe');
            return;
        }
        
        produtos.forEach((det, index) => {
            const prod = det.querySelector('prod');
            if (!prod) {
                result.erros.push(`Produto ${index + 1}: tag <prod> não encontrada`);
                return;
            }
            
            const codigo = prod.querySelector('cProd')?.textContent;
            const descricao = prod.querySelector('xProd')?.textContent;
            const ncm = prod.querySelector('NCM')?.textContent;
            const cfop = prod.querySelector('CFOP')?.textContent;
            const quantidade = prod.querySelector('qCom')?.textContent;
            const valorUnitario = prod.querySelector('vUnCom')?.textContent;
            const valorTotal = prod.querySelector('vProd')?.textContent;
            
            if (!codigo) {
                result.erros.push(`Produto ${index + 1}: código não informado`);
            }
            
            if (!descricao || descricao.trim().length < 2) {
                result.erros.push(`Produto ${index + 1}: descrição inválida`);
            }
            
            if (!ncm) {
                result.avisos.push(`Produto ${index + 1}: NCM não informado`);
            }
            
            if (!cfop) {
                result.erros.push(`Produto ${index + 1}: CFOP não informado`);
            }
            
            if (!quantidade || parseFloat(quantidade) <= 0) {
                result.erros.push(`Produto ${index + 1}: quantidade inválida`);
            }
            
            if (!valorUnitario || parseFloat(valorUnitario) <= 0) {
                result.erros.push(`Produto ${index + 1}: valor unitário inválido`);
            }
            
            if (!valorTotal || parseFloat(valorTotal) <= 0) {
                result.erros.push(`Produto ${index + 1}: valor total inválido`);
            }
            
            // Validar cálculo: quantidade * valor unitário ≈ valor total
            if (quantidade && valorUnitario && valorTotal) {
                const calculado = parseFloat(quantidade) * parseFloat(valorUnitario);
                const informado = parseFloat(valorTotal);
                const diferenca = Math.abs(calculado - informado);
                
                if (diferenca > 0.01) {
                    result.avisos.push(`Produto ${index + 1}: divergência no cálculo (calculado: ${calculado.toFixed(2)}, informado: ${informado.toFixed(2)})`);
                }
            }
        });
    }
    
    function validarTotais(xmlDoc, result) {
        const total = xmlDoc.querySelector('total');
        if (!total) {
            result.erros.push('Totais não encontrados');
            return;
        }
        
        const icmsTot = total.querySelector('ICMSTot');
        if (!icmsTot) {
            result.erros.push('Total ICMS não encontrado');
            return;
        }
        
        const valorNF = parseFloat(icmsTot.querySelector('vNF')?.textContent || 0);
        const valorProdutos = parseFloat(icmsTot.querySelector('vProd')?.textContent || 0);
        const valorFrete = parseFloat(icmsTot.querySelector('vFrete')?.textContent || 0);
        const valorSeguro = parseFloat(icmsTot.querySelector('vSeg')?.textContent || 0);
        const valorDesconto = parseFloat(icmsTot.querySelector('vDesc')?.textContent || 0);
        const valorOutros = parseFloat(icmsTot.querySelector('vOutro')?.textContent || 0);
        
        if (valorNF <= 0) {
            result.erros.push('Valor total da NF deve ser maior que zero');
        }
        
        if (valorProdutos <= 0) {
            result.erros.push('Valor total dos produtos deve ser maior que zero');
        }
        
        // Validar cálculo aproximado: produtos + frete + seguro - desconto + outros ≈ valor NF
        const calculado = valorProdutos + valorFrete + valorSeguro - valorDesconto + valorOutros;
        const diferenca = Math.abs(calculado - valorNF);
        
        if (diferenca > 0.01) {
            result.avisos.push(`Divergência nos totais (calculado: ${calculado.toFixed(2)}, informado: ${valorNF.toFixed(2)})`);
        }
        
        // Validar soma dos produtos
        const produtos = xmlDoc.querySelectorAll('det');
        let somaProdutos = 0;
        produtos.forEach(det => {
            const valorProd = parseFloat(det.querySelector('prod vProd')?.textContent || 0);
            somaProdutos += valorProd;
        });
        
        if (produtos.length > 0 && Math.abs(somaProdutos - valorProdutos) > 0.01) {
            result.avisos.push(`Divergência na soma dos produtos (soma: ${somaProdutos.toFixed(2)}, total: ${valorProdutos.toFixed(2)})`);
        }
    }
    
    function validarAssinatura(xmlDoc, result) {
        const signature = xmlDoc.querySelector('Signature');
        if (!signature) {
            result.avisos.push('Assinatura digital não encontrada');
            return;
        }
        
        const signatureValue = signature.querySelector('SignatureValue');
        if (!signatureValue || !signatureValue.textContent) {
            result.erros.push('Valor da assinatura digital não encontrado');
        }
    }
    
    // ============================================    
    // CÁLCULO DE DÍGITO VERIFICADOR DA CHAVE NFe    
    // ============================================
    
    function calcularDVChaveNFe(chave) {
        if (chave.length !== 43) {
            return null;
        }
        
        let soma = 0;
        let peso = 2;
        
        // Percorre a chave de trás para frente
        for (let i = chave.length - 1; i >= 0; i--) {
            soma += parseInt(chave[i]) * peso;
            peso++;
            if (peso > 9) {
                peso = 2;
            }
        }
        
        const resto = soma % 11;
        const dv = resto < 2 ? 0 : 11 - resto;
        
        return dv;
    }
    
    // ============================================    
    // VALIDADOR CT-e    
    // ============================================
    
    function validarCTe(xmlDoc, result) {  
        const infCte = xmlDoc.querySelector('infCte');  
        if (!infCte) {  
            result.valido = false;  
            result.erros.push('Tag <infCte> não encontrada');  
            return result;  
        }
        
        result.dados = extrairDadosCTe(xmlDoc);  
        validarCamposObrigatoriosCTe(xmlDoc, result);  
        validarChaveAcesso(xmlDoc, result, 'CTe');  
        validarEmitenteTransporte(xmlDoc, result);  
        validarRemetenteDestinatarioCTe(xmlDoc, result);  
        validarCargaCTe(xmlDoc, result);  
        validarValoresCTe(xmlDoc, result);  
        validarAssinatura(xmlDoc, result);
        
        result.valido = result.erros.length === 0;  
        return result;  
    }
    
    function extrairDadosCTe(xmlDoc) {  
        const dados = {};
        
        // Chave de acesso  
        const infCte = xmlDoc.querySelector('infCte');  
        dados.chaveAcesso = infCte?.getAttribute('Id')?.replace('CTe', '');
        
        // Dados da IDE  
        const ide = xmlDoc.querySelector('ide');  
        if (ide) {  
            dados.numero = ide.querySelector('nCT')?.textContent;  
            dados.serie = ide.querySelector('serie')?.textContent;  
            dados.dataEmissao = ide.querySelector('dhEmi')?.textContent;  
            dados.modelo = ide.querySelector('mod')?.textContent;  
            dados.tipo = ide.querySelector('tpCTe')?.textContent; // 0=Normal, 1=Complementar, 2=Anulação, 3=Substituto  
            dados.tipoServico = ide.querySelector('tpServ')?.textContent; // 0=Normal, 1=Subcontratação, etc  
            dados.naturezaOperacao = ide.querySelector('natOp')?.textContent;  
        }
        
        // Emitente (Transportadora)  
        const emit = xmlDoc.querySelector('emit');  
        if (emit) {  
            dados.emitente = {  
                cnpj: emit.querySelector('CNPJ')?.textContent,  
                razaoSocial: emit.querySelector('xNome')?.textContent,  
                nomeFantasia: emit.querySelector('xFant')?.textContent,  
                ie: emit.querySelector('IE')?.textContent  
            };  
        }
        
        // Remetente  
        const rem = xmlDoc.querySelector('rem');  
        if (rem) {  
            dados.remetente = {  
                cpfCnpj: rem.querySelector('CNPJ')?.textContent || rem.querySelector('CPF')?.textContent,  
                nome: rem.querySelector('xNome')?.textContent,  
                ie: rem.querySelector('IE')?.textContent,  
                endereco: extrairEndereco(rem)  
            };  
        }
        
        // Destinatário  
        const dest = xmlDoc.querySelector('dest');  
        if (dest) {  
            dados.destinatario = {  
                cpfCnpj: dest.querySelector('CNPJ')?.textContent || dest.querySelector('CPF')?.textContent,  
                nome: dest.querySelector('xNome')?.textContent,  
                ie: dest.querySelector('IE')?.textContent,  
                endereco: extrairEndereco(dest)  
            };  
        }
        
        // Expedidor  
        const exped = xmlDoc.querySelector('exped');  
        if (exped) {  
            dados.expedidor = {  
                cpfCnpj: exped.querySelector('CNPJ')?.textContent || exped.querySelector('CPF')?.textContent,  
                nome: exped.querySelector('xNome')?.textContent  
            };  
        }
        
        // Recebedor  
        const receb = xmlDoc.querySelector('receb');  
        if (receb) {  
            dados.recebedor = {  
                cpfCnpj: receb.querySelector('CNPJ')?.textContent || receb.querySelector('CPF')?.textContent,  
                nome: receb.querySelector('xNome')?.textContent  
            };  
        }
        
        // Informações da Carga  
        const infCarga = xmlDoc.querySelector('infCarga');  
        if (infCarga) {  
            dados.carga = {  
                valorTotal: infCarga.querySelector('vCarga')?.textContent,  
                produto: infCarga.querySelector('proPred')?.textContent,  
                outrasCaracteristicas: infCarga.querySelector('xOutCat')?.textContent  
            };
            
            // Quantidades de carga  
            const infQ = infCarga.querySelectorAll('infQ');  
            dados.carga.quantidades = Array.from(infQ).map(q => ({  
                unidade: q.querySelector('cUnid')?.textContent,  
                tipo: q.querySelector('tpMed')?.textContent,  
                quantidade: q.querySelector('qCarga')?.textContent  
            }));  
        }
        
        // Valores do CT-e  
        const vPrest = xmlDoc.querySelector('vPrest');  
        if (vPrest) {  
            dados.valores = {  
                valorTotal: vPrest.querySelector('vTPrest')?.textContent,  
                valorReceber: vPrest.querySelector('vRec')?.textContent  
            };
            
            // Componentes do valor  
            const comp = vPrest.querySelectorAll('Comp');  
            dados.valores.componentes = Array.from(comp).map(c => ({  
                nome: c.querySelector('xNome')?.textContent,  
                valor: c.querySelector('vComp')?.textContent  
            }));  
        }
        
        // Impostos  
        const imp = xmlDoc.querySelector('imp');  
        if (imp) {  
            dados.impostos = {  
                icms: imp.querySelector('vTotTrib')?.textContent,  
                icmsBase: imp.querySelector('vBC')?.textContent,  
                icmsValor: imp.querySelector('vICMS')?.textContent  
            };  
        }
        
        // Documentos relacionados (NF-e vinculadas)  
        const infNFe = xmlDoc.querySelectorAll('infNFe');  
        dados.documentosVinculados = Array.from(infNFe).map(nf => ({  
            chave: nf.querySelector('chave')?.textContent  
        }));
        
        // Modal (tipo de transporte)  
        const modal = xmlDoc.querySelector('modal')?.textContent;  
        dados.modal = modal; // 01=Rodoviário, 02=Aéreo, 03=Aquaviário, etc
        
        // Informações do modal rodoviário  
        if (modal === '01') {  
            const rodo = xmlDoc.querySelector('rodo');  
            if (rodo) {  
                dados.rodoviario = {  
                    rntrc: rodo.querySelector('RNTRC')?.textContent  
                };  
            }  
        }
        
        // Protocolo de autorização  
        const protCTe = xmlDoc.querySelector('protCTe infProt');  
        if (protCTe) {  
            dados.protocolo = {  
                numero: protCTe.querySelector('nProt')?.textContent,  
                dataAutorizacao: protCTe.querySelector('dhRecbto')?.textContent,  
                status: protCTe.querySelector('cStat')?.textContent,  
                motivo: protCTe.querySelector('xMotivo')?.textContent  
            };  
        }
        
        return dados;  
    }
    
    function validarCamposObrigatoriosCTe(xmlDoc, result) {  
        const camposObrigatorios = [  
            { tag: 'ide', nome: 'Identificação do CT-e' },  
            { tag: 'emit', nome: 'Emitente (Transportadora)' },  
            { tag: 'rem', nome: 'Remetente' },  
            { tag: 'dest', nome: 'Destinatário' },  
            { tag: 'vPrest', nome: 'Valores da Prestação' },  
            { tag: 'imp', nome: 'Impostos' },  
            { tag: 'infCarga', nome: 'Informações da Carga' }  
        ];
        
        camposObrigatorios.forEach(campo => {  
            if (!xmlDoc.querySelector(campo.tag)) {  
                result.erros.push(`Campo obrigatório ausente: ${campo.nome} (<${campo.tag}>)`);  
            }  
        });  
    }
    
    function validarEmitenteTransporte(xmlDoc, result) {  
        const emit = xmlDoc.querySelector('emit');  
        if (!emit) return;
        
        const cnpj = emit.querySelector('CNPJ')?.textContent;  
        const razaoSocial = emit.querySelector('xNome')?.textContent;  
        const ie = emit.querySelector('IE')?.textContent;
        
        if (!cnpj) {  
            result.erros.push('CNPJ do emitente (transportadora) não informado');  
        } else if (!validarCNPJ(cnpj)) {  
            result.erros.push('CNPJ do emitente inválido: ' + cnpj);  
        }
        
        if (!razaoSocial || razaoSocial.trim().length < 2) {  
            result.erros.push('Razão social do emitente inválida');  
        }
        
        if (!ie) {  
            result.avisos.push('Inscrição estadual do emitente não informada');  
        }  
    }
    
    function validarRemetenteDestinatarioCTe(xmlDoc, result) {  
        // Valida Remetente  
        const rem = xmlDoc.querySelector('rem');  
        if (!rem) {  
            result.erros.push('Remetente não informado');  
        } else {  
            const cnpj = rem.querySelector('CNPJ')?.textContent;  
            const cpf = rem.querySelector('CPF')?.textContent;  
            const nome = rem.querySelector('xNome')?.textContent;
            
            if (!cnpj && !cpf) {  
                result.erros.push('CPF/CNPJ do remetente não informado');  
            } else if (cnpj && !validarCNPJ(cnpj)) {  
                result.erros.push('CNPJ do remetente inválido');  
            } else if (cpf && !validarCPF(cpf)) {  
                result.erros.push('CPF do remetente inválido');  
            }
            
            if (!nome) {  
                result.erros.push('Nome do remetente não informado');  
            }  
        }
        
        // Valida Destinatário  
        const dest = xmlDoc.querySelector('dest');  
        if (!dest) {  
            result.erros.push('Destinatário não informado');  
        } else {  
            const cnpj = dest.querySelector('CNPJ')?.textContent;  
            const cpf = dest.querySelector('CPF')?.textContent;  
            const nome = dest.querySelector('xNome')?.textContent;
            
            if (!cnpj && !cpf) {  
                result.erros.push('CPF/CNPJ do destinatário não informado');  
            } else if (cnpj && !validarCNPJ(cnpj)) {  
                result.erros.push('CNPJ do destinatário inválido');  
            } else if (cpf && !validarCPF(cpf)) {  
                result.erros.push('CPF do destinatário inválido');  
            }
            
            if (!nome) {  
                result.erros.push('Nome do destinatário não informado');  
            }  
        }  
    }
    
    function validarCargaCTe(xmlDoc, result) {  
        const infCarga = xmlDoc.querySelector('infCarga');
        
        if (!infCarga) {  
            result.erros.push('Informações da carga não encontradas');  
            return;  
        }
        
        const vCarga = infCarga.querySelector('vCarga')?.textContent;  
        const proPred = infCarga.querySelector('proPred')?.textContent;
        
        if (!vCarga || parseFloat(vCarga) < 0) {  
            result.erros.push('Valor da carga inválido');  
        }
        
        if (!proPred) {  
            result.avisos.push('Produto predominante não informado');  
        }
        
        // Valida quantidades  
        const infQ = infCarga.querySelectorAll('infQ');  
        if (infQ.length === 0) {  
            result.avisos.push('Nenhuma quantidade de carga informada');  
        }  
    }
    
    function validarValoresCTe(xmlDoc, result) {  
        const vPrest = xmlDoc.querySelector('vPrest');
        
        if (!vPrest) {  
            result.erros.push('Valores da prestação não encontrados');  
            return;  
        }
        
        const vTPrest = parseFloat(vPrest.querySelector('vTPrest')?.textContent || 0);  
        const vRec = parseFloat(vPrest.querySelector('vRec')?.textContent || 0);
        
        if (vTPrest <= 0) {  
            result.erros.push('Valor total da prestação deve ser maior que zero');  
        }
        
        if (vRec <= 0) {  
            result.avisos.push('Valor a receber não informado ou zerado');  
        }
        
        // Valida soma dos componentes  
        const comp = vPrest.querySelectorAll('Comp');  
        let somaComponentes = 0;  
        comp.forEach(c => {  
            somaComponentes += parseFloat(c.querySelector('vComp')?.textContent || 0);  
        });
        
        if (comp.length > 0 && Math.abs(somaComponentes - vTPrest) > 0.02) {  
            result.avisos.push(`Divergência nos componentes de valor (soma: ${somaComponentes.toFixed(2)}, total: ${vTPrest.toFixed(2)})`);  
        }  
    }
    
    // ============================================    
    // VALIDADOR MDF-e (Manifesto)    
    // ============================================
    
    function validarMDFe(xmlDoc, result) {  
        const infMDFe = xmlDoc.querySelector('infMDFe');  
        if (!infMDFe) {  
            result.valido = false;  
            result.erros.push('Tag <infMDFe> não encontrada');  
            return result;  
        }
        
        result.dados = extrairDadosMDFe(xmlDoc);  
        validarChaveAcesso(xmlDoc, result, 'MDFe');  
        result.avisos.push('Validação completa de MDF-e em desenvolvimento');
        
        result.valido = result.erros.length === 0;  
        return result;  
    }
    
    function extrairDadosMDFe(xmlDoc) {  
        const dados = {};  
        const infMDFe = xmlDoc.querySelector('infMDFe');  
        dados.chaveAcesso = infMDFe?.getAttribute('Id')?.replace('MDFe', '');
        
        const ide = xmlDoc.querySelector('ide');  
        if (ide) {  
            dados.numero = ide.querySelector('nMDF')?.textContent;  
            dados.serie = ide.querySelector('serie')?.textContent;  
            dados.dataEmissao = ide.querySelector('dhEmi')?.textContent;  
        }
        
        return dados;  
    }
    
    // ============================================    
    // VALIDADOR NFS-e    
    // ============================================
    
    function validarNFSe(xmlDoc, result) {  
        result.dados = { tipo: 'NFSe' };  
        result.avisos.push('Validação de NFS-e em desenvolvimento (padrões variam por município)');  
        result.valido = result.erros.length === 0;  
        return result;  
    }
    
    // ============================================    
    // VALIDADOR CF-e SAT    
    // ============================================
    
    function validarCFeSAT(xmlDoc, result) {  
        result.dados = { tipo: 'CFeSAT' };  
        result.avisos.push('Validação de CF-e SAT em desenvolvimento');  
        result.valido = result.erros.length === 0;  
        return result;  
    }
    
    // ============================================    
    // VALIDAÇÃO DE CHAVE DE ACESSO (Universal)    
    // ============================================
    
    function validarChaveAcesso(xmlDoc, result, tipoDoc) {  
        const tagMap = {  
            'NFe': 'infNFe',  
            'CTe': 'infCte',  
            'MDFe': 'infMDFe'  
        };
        
        const tag = xmlDoc.querySelector(tagMap[tipoDoc]);  
        const chaveId = tag?.getAttribute('Id')?.replace(tipoDoc, '');
        
        if (!chaveId) {  
            result.erros.push('Chave de acesso não encontrada no atributo Id');  
            return;  
        }
        
        if (chaveId.length !== 44) {  
            result.erros.push(`Chave de acesso inválida: deve ter 44 dígitos (encontrado: ${chaveId.length})`);  
        }
        
        if (!/^\d+$/.test(chaveId)) {  
            result.erros.push('Chave de acesso deve conter apenas números');  
        }
        
        if (chaveId.length === 44) {  
            const dvInformado = parseInt(chaveId.charAt(43));  
            const dvCalculado = calcularDVChaveNFe(chaveId.substring(0, 43));
            
            if (dvInformado !== dvCalculado) {  
                result.erros.push(`Dígito verificador da chave inválido (informado: ${dvInformado}, esperado: ${dvCalculado})`);  
            }  
        }  
    }
    
    // ============================================    
    // FUNÇÕES AUXILIARES    
    // ============================================
    
    function extrairEndereco(node) {  
        const endereco = node.querySelector('enderEmit, enderDest, enderReme, enderDest');  
        if (!endereco) return null;
        
        return {  
            logradouro: endereco.querySelector('xLgr')?.textContent,  
            numero: endereco.querySelector('nro')?.textContent,  
            bairro: endereco.querySelector('xBairro')?.textContent,  
            municipio: endereco.querySelector('xMun')?.textContent,  
            uf: endereco.querySelector('UF')?.textContent,  
            cep: endereco.querySelector('CEP')?.textContent  
        };  
    }
    
    // ============================================    
    // ABA: VALIDADOR XML FISCAL - EVENT LISTENERS    
    // ============================================
    
    // Elementos da aba XML Fiscal
    const xmlFiscalInput = document.getElementById('xmlFiscalInput');
    const btnValidarXML = document.getElementById('btnValidarXML');
    const btnLimparXML = document.getElementById('btnLimparXML');
    const btnCopiarXMLJson = document.getElementById('btnCopiarXMLJson');
    const xmlFiscalResultado = document.getElementById('xmlFiscalResultado');
    
    // Função para processar e exibir resultado da validação
    function processarResultadoXML(resultado) {
        // Mostrar container de resultado
        xmlFiscalResultado.classList.remove('d-none');
        
        // Scroll suave até o resultado
        xmlFiscalResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Atualizar badge de status
        const badge = document.getElementById('xmlStatusBadge');
        if (resultado.valido) {
            badge.className = 'badge bg-success';
            badge.textContent = '✓ Válido';
        } else {
            badge.className = 'badge bg-danger';
            badge.textContent = '✗ Inválido';
        }
        
        // Tipo de documento
        const tipoDocumento = document.getElementById('xmlTipoDocumento');
        tipoDocumento.value = resultado.tipo || 'Não identificado';
        
        // Erros
        const errosContainer = document.getElementById('xmlErrosContainer');
        const errosLista = document.getElementById('xmlErrosLista');
        if (resultado.erros && resultado.erros.length > 0) {
            errosContainer.classList.remove('d-none');
            errosLista.innerHTML = '<ul class="mb-0">' + 
                resultado.erros.map(erro => `<li>${escapeHtml(erro)}</li>`).join('') + 
                '</ul>';
        } else {
            errosContainer.classList.add('d-none');
            errosLista.innerHTML = '';
        }
        
        // Avisos
        const avisosContainer = document.getElementById('xmlAvisosContainer');
        const avisosLista = document.getElementById('xmlAvisosLista');
        if (resultado.avisos && resultado.avisos.length > 0) {
            avisosContainer.classList.remove('d-none');
            avisosLista.innerHTML = '<ul class="mb-0">' + 
                resultado.avisos.map(aviso => `<li>${escapeHtml(aviso)}</li>`).join('') + 
                '</ul>';
        } else {
            avisosContainer.classList.add('d-none');
            avisosLista.innerHTML = '';
        }
        
        // Dados extraídos (JSON formatado)
        const dadosJson = JSON.stringify(resultado.dados, null, 2);
        document.getElementById('xmlDadosExtraidos').value = dadosJson;
    }
    
    // Função auxiliar para escapar HTML (prevenir XSS)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Event listener: Validar XML
    if (btnValidarXML) {
        btnValidarXML.addEventListener('click', function() {
            const xmlString = xmlFiscalInput.value.trim();
            
            // Validação básica
            if (!xmlString) {
                alert('Por favor, cole o XML do documento fiscal no campo de entrada.');
                xmlFiscalInput.focus();
                return;
            }
            
            // Verificar se parece ser XML
            if (!xmlString.startsWith('<?xml') && !xmlString.startsWith('<')) {
                if (!confirm('O texto não parece ser um XML válido. Deseja continuar mesmo assim?')) {
                    return;
                }
            }
            
            try {
                // Chamar função de validação
                const resultado = validarXMLFiscal(xmlString);
                
                // Processar e exibir resultado
                processarResultadoXML(resultado);
                
                // Feedback visual no botão
                mostrarFeedbackBotao(btnValidarXML, '✅ Validado!');
                
            } catch (error) {
                // Erro inesperado
                alert('Erro ao processar XML: ' + error.message);
                console.error('Erro na validação XML:', error);
            }
        });
    }
    
    // Função para formatar XML (prettify)
    function formatarXML(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            // Verifica se há erros de parsing
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML inválido: ' + parserError.textContent);
            }
            
            // Serializa o XML
            const serializer = new XMLSerializer();
            let formatted = serializer.serializeToString(xmlDoc);
            
            // Remove quebras de linha e espaços extras existentes
            formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            formatted = formatted.replace(/>\s+</g, '><');
            
            // Adiciona indentação
            const PADDING = '  '; // 2 espaços
            const reg = /(>)(<)(\/*)/g;
            formatted = formatted.replace(reg, '$1\n$2$3');
            
            let pad = 0;
            formatted = formatted.split('\n').map((node) => {
                let indent = 0;
                
                // Tag de fechamento
                if (node.match(/^<\/\w/)) {
                    if (pad > 0) {
                        pad -= 1;
                    }
                    indent = 0;
                }
                // Tag auto-fechada ou texto
                else if (node.match(/^<\w[^>]*\/>/) || node.match(/^[^<]/)) {
                    indent = 0;
                }
                // Tag de abertura
                else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                    indent = 1;
                }
                
                pad += indent;
                
                const padding = PADDING.repeat(Math.max(0, pad - indent));
                return padding + node.trim();
            }).join('\n');
            
            return formatted.trim();
        } catch (error) {
            throw new Error('Erro ao formatar XML: ' + error.message);
        }
    }
    
    // Função para compactar XML (minify)
    function compactarXML(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            // Verifica se há erros de parsing
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML inválido: ' + parserError.textContent);
            }
            
            // Serializa sem espaços
            const serializer = new XMLSerializer();
            let compacted = serializer.serializeToString(xmlDoc);
            
            // Remove espaços em branco desnecessários
            compacted = compacted.replace(/>\s+</g, '><');
            compacted = compacted.replace(/\s+/g, ' ');
            compacted = compacted.trim();
            
            return compacted;
        } catch (error) {
            throw new Error('Erro ao compactar XML: ' + error.message);
        }
    }
    
    // Event listener para formatar XML
    const btnFormatarXML = document.getElementById('btnFormatarXML');
    if (btnFormatarXML) {
        btnFormatarXML.addEventListener('click', function() {
            const xmlString = xmlFiscalInput.value.trim();
            
            if (!xmlString) {
                mostrarToast('⚠️ Por favor, cole um XML para formatar', 'warning');
                xmlFiscalInput.focus();
                return;
            }
            
            try {
                const xmlFormatado = formatarXML(xmlString);
                xmlFiscalInput.value = xmlFormatado;
                mostrarToast('✓ XML formatado com sucesso!', 'success');
                xmlFiscalInput.focus();
            } catch (error) {
                mostrarToast('❌ ' + error.message, 'error');
                console.error('Erro ao formatar XML:', error);
            }
        });
    }
    
    // Event listener para compactar XML
    const btnCompactarXML = document.getElementById('btnCompactarXML');
    if (btnCompactarXML) {
        btnCompactarXML.addEventListener('click', function() {
            const xmlString = xmlFiscalInput.value.trim();
            
            if (!xmlString) {
                mostrarToast('⚠️ Por favor, cole um XML para compactar', 'warning');
                xmlFiscalInput.focus();
                return;
            }
            
            try {
                const xmlCompactado = compactarXML(xmlString);
                xmlFiscalInput.value = xmlCompactado;
                mostrarToast('✓ XML compactado com sucesso!', 'success');
                xmlFiscalInput.focus();
            } catch (error) {
                mostrarToast('❌ ' + error.message, 'error');
                console.error('Erro ao compactar XML:', error);
            }
        });
    }
    
    // Event listener: Copiar XML
    const btnCopiarXML = document.getElementById('btnCopiarXML');
    if (btnCopiarXML) {
        btnCopiarXML.addEventListener('click', function() {
            const xmlText = xmlFiscalInput.value.trim();
            
            if (!xmlText) {
                mostrarToast('⚠️ Não há XML para copiar', 'warning');
                return;
            }
            
            // Seleciona e copia o texto
            xmlFiscalInput.select();
            document.execCommand('copy');
            mostrarFeedbackCopiar(btnCopiarXML);
        });
    }
    
    if (btnLimparXML) {
        btnLimparXML.addEventListener('click', function() {
            // Limpar textarea de entrada
            xmlFiscalInput.value = '';
            
            // Ocultar resultado
            xmlFiscalResultado.classList.add('d-none');
            
            // Resetar campos de resultado
            document.getElementById('xmlTipoDocumento').value = '';
            document.getElementById('xmlStatusBadge').textContent = '';
            document.getElementById('xmlStatusBadge').className = 'badge';
            document.getElementById('xmlErrosLista').innerHTML = '';
            document.getElementById('xmlAvisosLista').innerHTML = '';
            document.getElementById('xmlDadosExtraidos').value = '';
            
            // Focar no campo de entrada
            xmlFiscalInput.focus();
        });
    }
    
    // Event listener: Copiar JSON
    if (btnCopiarXMLJson) {
        btnCopiarXMLJson.addEventListener('click', function() {
            const dadosExtraidos = document.getElementById('xmlDadosExtraidos');
            const jsonText = dadosExtraidos.value.trim();
            
            if (!jsonText) {
                alert('Não há dados para copiar. Valide um XML primeiro.');
                return;
            }
            
            // Copiar para clipboard
            navigator.clipboard.writeText(jsonText).then(function() {
                mostrarFeedbackCopiar(btnCopiarXMLJson);
            }).catch(function(err) {
                console.error('Erro ao copiar:', err);
                alert('Erro ao copiar. Tente selecionar e copiar manualmente.');
            });
        });
    }
    
    // ============================================    
    // ABA: CONTADOR DE TEMPO PARA DEMANDAS    
    // ============================================
    
    let tarefas = []; // Array para armazenar todas as tarefas
    let intervalosAtualizacao = {}; // Objeto para armazenar intervalos de atualização
    const STORAGE_KEY = 'qa-toolbox-tarefas'; // Chave para localStorage
    
    // Função para salvar tarefas no localStorage
    function salvarTarefas() {
        try {
            // Atualiza tempo decorrido de tarefas rodando antes de salvar
            const agora = Date.now();
            tarefas.forEach(tarefa => {
                if (tarefa.estado === 'rodando' && tarefa.ultimoStart) {
                    const tempoDecorrido = Math.floor((agora - tarefa.ultimoStart) / 1000);
                    tarefa.tempoDecorrido = (tarefa.tempoDecorrido || 0) + tempoDecorrido;
                    tarefa.ultimoStart = agora; // Atualiza para o momento atual
                }
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
        } catch (error) {
            console.error('Erro ao salvar tarefas no localStorage:', error);
        }
    }
    
    // Função para carregar tarefas do localStorage
    function carregarTarefas() {
        try {
            const dadosSalvos = localStorage.getItem(STORAGE_KEY);
            if (dadosSalvos) {
                const tarefasCarregadas = JSON.parse(dadosSalvos);
                const agora = Date.now();
                
                tarefas = tarefasCarregadas.map(tarefa => {
                    if (tarefa.estado === 'rodando' && tarefa.ultimoStart) {
                        // Calcula tempo decorrido desde o último start até agora
                        const tempoDecorridoDesdeStart = Math.floor((agora - tarefa.ultimoStart) / 1000);
                        
                        // Adiciona ao tempo decorrido total
                        tarefa.tempoDecorrido = (tarefa.tempoDecorrido || 0) + tempoDecorridoDesdeStart;
                        
                        // Atualiza último start para agora (reinicia contador)
                        tarefa.ultimoStart = agora;
                    }
                    
                    return tarefa;
                });
                
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas do localStorage:', error);
        }
        return false;
    }
    
    // Função para formatar tempo (segundos para HH:MM:SS)
    function formatarTempo(segundos) {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    }
    
    // Função para calcular tempo total (incluindo pausas)
    function calcularTempoTotal(tarefa) {
        let tempoTotal = tarefa.tempoDecorrido || 0;
        
        // Adiciona tempo desde o último start (se estiver rodando)
        if (tarefa.estado === 'rodando' && tarefa.ultimoStart) {
            const agora = Date.now();
            tempoTotal += Math.floor((agora - tarefa.ultimoStart) / 1000);
        }
        
        return tempoTotal;
    }
    
    // Função para atualizar display do timer
    function atualizarTimer(tarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa) return;
        
        const tempoTotal = calcularTempoTotal(tarefa);
        const elemento = document.getElementById(`timer-${tarefaId}`);
        if (elemento) {
            elemento.textContent = formatarTempo(tempoTotal);
        }
    }
    
    // Função para criar HTML de uma tarefa
    function criarHTMLTarefa(tarefa) {
        const tempoTotal = calcularTempoTotal(tarefa);
        const estadoBadge = {
            'rodando': '<span class="badge bg-success">▶️ Rodando</span>',
            'pausado': '<span class="badge bg-warning">⏸️ Pausado</span>',
            'finalizado': '<span class="badge bg-secondary">⏹️ Finalizado</span>'
        };
        
        let pausasHTML = '';
        if (tarefa.pausas && tarefa.pausas.length > 0) {
            pausasHTML = '<div class="mt-2"><small class="text-muted fw-bold">Histórico de Pausas:</small><ul class="list-unstyled small mt-1">';
            tarefa.pausas.forEach((pausa, index) => {
                const duracao = formatarTempo(pausa.duracao || 0);
                pausasHTML += `<li>${index + 1}. ${pausa.motivo || 'Sem motivo'} - Duração: ${duracao} (${new Date(pausa.inicio).toLocaleTimeString()})</li>`;
            });
            pausasHTML += '</ul></div>';
        }
        
        return `
            <div class="card mb-3" id="tarefa-card-${tarefa.id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">📋 ${tarefa.nome}</h5>
                    ${estadoBadge[tarefa.estado] || ''}
                </div>
                <div class="card-body">
                    <div class="row align-items-center mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Tempo Decorrido:</label>
                            <div class="display-6 text-primary" id="timer-${tarefa.id}">${formatarTempo(tempoTotal)}</div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex gap-2 flex-wrap">
                                ${tarefa.estado === 'rodando' 
                                    ? `<button type="button" class="btn btn-warning btn-sm" onclick="pausarTarefa('${tarefa.id}')">⏸️ Pausar</button>`
                                    : tarefa.estado === 'pausado'
                                    ? `<button type="button" class="btn btn-primary btn-sm" onclick="retomarTarefa('${tarefa.id}')">▶️ Retomar</button>`
                                    : ''
                                }
                                ${tarefa.estado !== 'finalizado'
                                    ? `<button type="button" class="btn btn-danger btn-sm" onclick="finalizarTarefa('${tarefa.id}')">⏹️ Finalizar</button>`
                                    : ''
                                }
                                <button type="button" class="btn btn-utility btn-sm" onclick="removerTarefa('${tarefa.id}')">🗑️ Remover</button>
                            </div>
                        </div>
                    </div>
                    
                    ${tarefa.estado === 'pausado' && tarefa.pausaAtual
                        ? `<div class="mb-3">
                            <label class="form-label fw-bold">Motivo da Pausa:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="motivo-pausa-${tarefa.id}" 
                                       placeholder="Ex: Bug encontrado, Aguardando resposta, etc.">
                                <button type="button" class="btn btn-warning" onclick="confirmarPausa('${tarefa.id}')">✓ Confirmar Pausa</button>
                            </div>
                          </div>`
                        : ''
                    }
                    
                    ${pausasHTML}
                    
                    <!-- Informações de Data/Hora -->
                    <div class="mt-3 pt-3 border-top">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <span class="me-2">📅</span>
                                    <div>
                                        <small class="text-muted d-block mb-0"><strong>Data/Hora de Início:</strong></small>
                                        <span class="text-primary fw-bold">${new Date(tarefa.dataInicio).toLocaleString('pt-BR', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            second: '2-digit' 
                                        })}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <span class="me-2">📅</span>
                                    <div>
                                        <small class="text-muted d-block mb-0"><strong>Data/Hora de Término:</strong></small>
                                        ${tarefa.dataFim 
                                            ? `<span class="text-primary fw-bold">${new Date(tarefa.dataFim).toLocaleString('pt-BR', { 
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit', 
                                                second: '2-digit' 
                                            })}</span>`
                                            : `<span class="text-muted">Em andamento...</span>`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${tarefa.estado === 'finalizado'
                        ? `<div class="alert alert-info mt-2">
                            <strong>⏱️ Tempo Total:</strong> ${formatarTempo(tempoTotal)}
                          </div>`
                        : ''
                    }
                </div>
            </div>
        `;
    }
    
    // Função para renderizar todas as tarefas
    function renderizarTarefas() {
        const container = document.getElementById('tarefasContainer');
        const semTarefas = document.getElementById('semTarefasMensagem');
        const btnLimpar = document.getElementById('btnLimparTarefasFinalizadas');
        
        if (tarefas.length === 0) {
            container.innerHTML = '';
            if (semTarefas) semTarefas.style.display = 'block';
            if (btnLimpar) btnLimpar.style.display = 'none';
            salvarTarefas(); // Salva estado vazio
            return;
        }
        
        if (semTarefas) semTarefas.style.display = 'none';
        container.innerHTML = tarefas.map(tarefa => criarHTMLTarefa(tarefa)).join('');
        
        // Atualiza botão de limpar tarefas finalizadas
        const tarefasFinalizadas = tarefas.filter(t => t.estado === 'finalizado');
        if (btnLimpar) {
            if (tarefasFinalizadas.length > 0) {
                btnLimpar.style.display = 'block';
                btnLimpar.innerHTML = `🗑️ Limpar Tarefas Finalizadas (${tarefasFinalizadas.length})`;
            } else {
                btnLimpar.style.display = 'none';
            }
        }
        
        // Inicia intervalos de atualização para tarefas rodando
        tarefas.forEach(tarefa => {
            if (tarefa.estado === 'rodando') {
                if (!intervalosAtualizacao[tarefa.id]) {
                    intervalosAtualizacao[tarefa.id] = setInterval(() => {
                        atualizarTimer(tarefa.id);
                    }, 1000);
                }
            } else {
                if (intervalosAtualizacao[tarefa.id]) {
                    clearInterval(intervalosAtualizacao[tarefa.id]);
                    delete intervalosAtualizacao[tarefa.id];
                }
            }
        });
        
        // Salva após renderizar
        salvarTarefas();
    }
    
    // Função para criar nova tarefa
    window.criarTarefa = function() {
        const nomeInput = document.getElementById('novaTarefaNome');
        const nome = nomeInput.value.trim();
        
        if (!nome) {
            mostrarToast('⚠️ Por favor, informe o nome/número da demanda', 'warning');
            nomeInput.focus();
            return;
        }
        
        const novaTarefa = {
            id: 'tarefa-' + Date.now(),
            nome: nome,
            estado: 'rodando',
            dataInicio: Date.now(),
            ultimoStart: Date.now(),
            tempoDecorrido: 0,
            pausas: [],
            pausaAtual: null
        };
        
        tarefas.push(novaTarefa);
        nomeInput.value = '';
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('✓ Tarefa criada e iniciada!', 'success');
    };
    
    // Função para pausar tarefa
    window.pausarTarefa = function(tarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa || tarefa.estado !== 'rodando') return;
        
        // Calcula tempo decorrido desde o último start
        const agora = Date.now();
        const tempoDecorrido = Math.floor((agora - tarefa.ultimoStart) / 1000);
        tarefa.tempoDecorrido = (tarefa.tempoDecorrido || 0) + tempoDecorrido;
        
        // Inicia pausa (aguardando motivo)
        tarefa.estado = 'pausado';
        tarefa.pausaAtual = {
            inicio: agora,
            motivo: null
        };
        
        if (intervalosAtualizacao[tarefaId]) {
            clearInterval(intervalosAtualizacao[tarefaId]);
            delete intervalosAtualizacao[tarefaId];
        }
        
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('⏸️ Tarefa pausada. Informe o motivo da pausa.', 'info');
    };
    
    // Função para confirmar pausa com motivo
    window.confirmarPausa = function(tarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa || !tarefa.pausaAtual) return;
        
        const motivoInput = document.getElementById(`motivo-pausa-${tarefaId}`);
        const motivo = motivoInput ? motivoInput.value.trim() : 'Sem motivo informado';
        
        const agora = Date.now();
        const duracaoPausa = Math.floor((agora - tarefa.pausaAtual.inicio) / 1000);
        
        tarefa.pausas.push({
            inicio: tarefa.pausaAtual.inicio,
            fim: agora,
            duracao: duracaoPausa,
            motivo: motivo || 'Sem motivo informado'
        });
        
        tarefa.pausaAtual = null;
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('✓ Pausa registrada com sucesso!', 'success');
    };
    
    // Função para retomar tarefa
    window.retomarTarefa = function(tarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa || tarefa.estado !== 'pausado') return;
        
        // Se havia pausa atual sem confirmar, confirma automaticamente
        if (tarefa.pausaAtual) {
            const motivoInput = document.getElementById(`motivo-pausa-${tarefaId}`);
            const motivo = motivoInput ? motivoInput.value.trim() : 'Sem motivo informado';
            
            const agora = Date.now();
            const duracaoPausa = Math.floor((agora - tarefa.pausaAtual.inicio) / 1000);
            
            tarefa.pausas.push({
                inicio: tarefa.pausaAtual.inicio,
                fim: agora,
                duracao: duracaoPausa,
                motivo: motivo || 'Sem motivo informado'
            });
            
            tarefa.pausaAtual = null;
        }
        
        tarefa.estado = 'rodando';
        tarefa.ultimoStart = Date.now();
        
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('▶️ Tarefa retomada!', 'success');
    };
    
    // Função para finalizar tarefa
    window.finalizarTarefa = function(tarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa || tarefa.estado === 'finalizado') return;
        
        // Calcula tempo final
        if (tarefa.estado === 'rodando') {
            const agora = Date.now();
            const tempoDecorrido = Math.floor((agora - tarefa.ultimoStart) / 1000);
            tarefa.tempoDecorrido = (tarefa.tempoDecorrido || 0) + tempoDecorrido;
        }
        
        // Se havia pausa atual sem confirmar, confirma automaticamente
        if (tarefa.pausaAtual) {
            const motivoInput = document.getElementById(`motivo-pausa-${tarefaId}`);
            const motivo = motivoInput ? motivoInput.value.trim() : 'Sem motivo informado';
            
            const agora = Date.now();
            const duracaoPausa = Math.floor((agora - tarefa.pausaAtual.inicio) / 1000);
            
            tarefa.pausas.push({
                inicio: tarefa.pausaAtual.inicio,
                fim: agora,
                duracao: duracaoPausa,
                motivo: motivo || 'Sem motivo informado'
            });
            
            tarefa.pausaAtual = null;
        }
        
        tarefa.estado = 'finalizado';
        tarefa.dataFim = Date.now();
        
        if (intervalosAtualizacao[tarefaId]) {
            clearInterval(intervalosAtualizacao[tarefaId]);
            delete intervalosAtualizacao[tarefaId];
        }
        
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('⏹️ Tarefa finalizada!', 'success');
    };
    
    // Função para remover tarefa
    window.removerTarefa = function(tarefaId) {
        if (!confirm('Tem certeza que deseja remover esta tarefa?')) {
            return;
        }
        
        tarefas = tarefas.filter(t => t.id !== tarefaId);
        
        if (intervalosAtualizacao[tarefaId]) {
            clearInterval(intervalosAtualizacao[tarefaId]);
            delete intervalosAtualizacao[tarefaId];
        }
        
        salvarTarefas();
        renderizarTarefas();
        mostrarToast('🗑️ Tarefa removida!', 'info');
    };
    
    // Função para limpar tarefas finalizadas
    window.limparTarefasFinalizadas = function() {
        const tarefasFinalizadas = tarefas.filter(t => t.estado === 'finalizado');
        
        if (tarefasFinalizadas.length === 0) {
            mostrarToast('ℹ️ Não há tarefas finalizadas para remover.', 'info');
            return;
        }
        
        if (!confirm(`Tem certeza que deseja remover ${tarefasFinalizadas.length} tarefa(s) finalizada(s)?`)) {
            return;
        }
        
        // Remove apenas tarefas finalizadas
        tarefas = tarefas.filter(t => t.estado !== 'finalizado');
        
        // Limpa intervalos das tarefas removidas (se houver algum)
        tarefasFinalizadas.forEach(tarefa => {
            if (intervalosAtualizacao[tarefa.id]) {
                clearInterval(intervalosAtualizacao[tarefa.id]);
                delete intervalosAtualizacao[tarefa.id];
            }
        });
        
        salvarTarefas();
        renderizarTarefas();
        mostrarToast(`🗑️ ${tarefasFinalizadas.length} tarefa(s) finalizada(s) removida(s)!`, 'success');
    };
    
    // Event listener para criar tarefa
    document.getElementById('btnCriarTarefa').addEventListener('click', criarTarefa);
    
    // Event listener para Enter no campo de nome
    document.getElementById('novaTarefaNome').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            criarTarefa();
        }
    });
    
    // Event listener para limpar tarefas finalizadas
    document.getElementById('btnLimparTarefasFinalizadas').addEventListener('click', limparTarefasFinalizadas);
    
    // Salva tarefas periodicamente (a cada 30 segundos) para tarefas rodando
    setInterval(() => {
        const temTarefasRodando = tarefas.some(t => t.estado === 'rodando');
        if (temTarefasRodando) {
            salvarTarefas();
        }
    }, 30000); // 30 segundos
    
    // Salva antes de fechar/recarregar a página
    window.addEventListener('beforeunload', () => {
        salvarTarefas();
    });
    
    // Carrega tarefas do localStorage ao iniciar
    const carregouTarefas = carregarTarefas();
    if (carregouTarefas && tarefas.length > 0) {
        mostrarToast(`✓ ${tarefas.length} tarefa(s) restaurada(s) do último uso!`, 'success');
    }
    
    // Renderiza tarefas ao carregar
    renderizarTarefas();
});

