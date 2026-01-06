"""
Rotas de Usuários
Endpoints: CRUD completo de usuários (apenas admin)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.schemas.user_schema import (
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    UserChangePassword
)
from backend.services.user_service import UserService
from backend.utils.dependencies import get_current_user, require_admin
from backend.models.user import User
from typing import List

# Criar router com prefixo e tag
router = APIRouter(prefix="/users", tags=["Usuários"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## ➕ Criar Novo Usuário
    
    Cria um novo usuário no sistema.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **nome_completo**: Nome completo do usuário
    - **username**: Username único (será convertido para minúsculo)
    - **email**: Email único
    - **empresa**: Nome da empresa
    - **cpf**: CPF com 11 dígitos (validação matemática)
    - **perfil**: "admin" ou "user"
    - **senha**: Senha forte (min 8 chars, maiúscula, minúscula, número, especial)
    
    ### Retorna:
    - Dados do usuário criado (sem senha)
    
    ### Erros:
    - **400**: Username, email ou CPF já cadastrado
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **422**: Dados inválidos (validação Pydantic)
    """
    novo_usuario = UserService.criar_usuario(db, user_data, str(current_user.id))
    return novo_usuario

@router.get("/", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
async def listar_usuarios(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    apenas_ativos: bool = Query(False, description="Filtrar apenas usuários ativos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 📋 Listar Usuários
    
    Lista todos os usuários do sistema com paginação.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros de Query:
    - **skip**: Número de registros a pular (paginação) - padrão: 0
    - **limit**: Número máximo de registros (1-1000) - padrão: 100
    - **apenas_ativos**: Filtrar apenas usuários ativos - padrão: false
    
    ### Retorna:
    - Lista de usuários (sem senhas)
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    
    ### Exemplo:
    - GET /users/?skip=0&limit=10&apenas_ativos=true
    """
    usuarios = UserService.listar_usuarios(db, skip, limit, apenas_ativos)
    return usuarios

@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def obter_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 🔍 Obter Usuário por ID
    
    Retorna detalhes de um usuário específico.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **user_id**: ID do usuário (UUID)
    
    ### Retorna:
    - Dados completos do usuário (sem senha)
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    """
    usuario = UserService.obter_usuario(db, user_id)
    return usuario

@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def atualizar_usuario(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## ✏️ Atualizar Usuário
    
    Atualiza dados de um usuário.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **user_id**: ID do usuário (UUID)
    - **Dados opcionais**: nome_completo, email, empresa, perfil, ativo
    
    ### Retorna:
    - Dados atualizados do usuário
    
    ### Erros:
    - **400**: Email já cadastrado por outro usuário
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    
    ### Nota:
    - Username e CPF não podem ser alterados
    - Apenas campos fornecidos serão atualizados
    """
    usuario = UserService.atualizar_usuario(db, user_id, user_data)
    return usuario

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def alterar_senha(
    senha_data: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ## 🔐 Alterar Própria Senha
    
    Permite ao usuário alterar sua própria senha.
    
    **Requer autenticação** (qualquer usuário pode alterar sua própria senha)
    
    ### Parâmetros:
    - **senha_atual**: Senha atual do usuário
    - **senha_nova**: Nova senha (validação forte)
    
    ### Retorna:
    - Mensagem de confirmação
    
    ### Erros:
    - **400**: Senha atual incorreta
    - **401**: Token inválido
    - **404**: Usuário não encontrado
    - **422**: Nova senha não atende requisitos
    """
    UserService.alterar_senha(db, str(current_user.id), senha_data)
    return {
        "message": "Senha alterada com sucesso",
        "username": current_user.username
    }

@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def resetar_senha_admin(
    user_id: str,
    nova_senha: str = Query(..., min_length=8, description="Nova senha para o usuário"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 🔓 Resetar Senha (Admin)
    
    Permite ao admin resetar a senha de qualquer usuário.
    
    **Requer perfil ADMIN**
    
    Não requer a senha atual do usuário.
    
    ### Parâmetros:
    - **user_id**: ID do usuário
    - **nova_senha**: Nova senha (query parameter)
    
    ### Retorna:
    - Mensagem de confirmação
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    
    ### Exemplo:
    - POST /users/{user_id}/reset-password?nova_senha=NovaSenha@123
    """
    UserService.resetar_senha_admin(db, user_id, nova_senha)
    usuario = UserService.obter_usuario(db, user_id)
    return {
        "message": "Senha resetada com sucesso",
        "username": usuario.username
    }

@router.post("/{user_id}/deactivate", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def desativar_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 🔒 Desativar Usuário
    
    Marca usuário como inativo (soft delete).
    
    **Requer perfil ADMIN**
    
    O usuário não será deletado, apenas marcado como inativo.
    Usuários inativos não podem fazer login.
    
    ### Parâmetros:
    - **user_id**: ID do usuário
    
    ### Retorna:
    - Dados do usuário desativado
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    """
    usuario = UserService.desativar_usuario(db, user_id)
    return usuario

@router.post("/{user_id}/activate", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def ativar_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 🔓 Ativar Usuário
    
    Reativa um usuário previamente desativado.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros:
    - **user_id**: ID do usuário
    
    ### Retorna:
    - Dados do usuário ativado
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    """
    usuario = UserService.ativar_usuario(db, user_id)
    return usuario

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def deletar_usuario(
    user_id: str,
    confirmar: bool = Query(False, description="Confirmar deleção permanente"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## ⚠️ Deletar Usuário (PERMANENTE)
    
    Deleta usuário permanentemente do banco de dados.
    
    **ATENÇÃO**: Esta ação é IRREVERSÍVEL!
    
    **Requer perfil ADMIN** + **Confirmação explícita**
    
    Recomenda-se usar desativar_usuario() em vez disso.
    
    ### Parâmetros:
    - **user_id**: ID do usuário
    - **confirmar**: Deve ser true para confirmar (query parameter)
    
    ### Retorna:
    - Mensagem de confirmação
    
    ### Erros:
    - **400**: Confirmação não fornecida
    - **401**: Token inválido
    - **403**: Usuário não é admin
    - **404**: Usuário não encontrado
    
    ### Exemplo:
    - DELETE /users/{user_id}?confirmar=true
    """
    if not confirmar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para deletar permanentemente, envie confirmar=true"
        )
    
    usuario = UserService.obter_usuario(db, user_id)
    username = usuario.username
    
    UserService.deletar_usuario(db, user_id)
    
    return {
        "message": "Usuário deletado permanentemente",
        "username": username,
        "user_id": user_id
    }

@router.get("/stats/count", status_code=status.HTTP_200_OK)
async def contar_usuarios(
    apenas_ativos: bool = Query(False, description="Contar apenas ativos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 📊 Estatísticas de Usuários
    
    Retorna contagem de usuários.
    
    **Requer perfil ADMIN**
    
    ### Parâmetros de Query:
    - **apenas_ativos**: Contar apenas usuários ativos - padrão: false
    
    ### Retorna:
    - **total**: Número total de usuários
    - **ativos**: Número de usuários ativos
    - **inativos**: Número de usuários inativos
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    """
    total = UserService.contar_usuarios(db, apenas_ativos=False)
    ativos = UserService.contar_usuarios(db, apenas_ativos=True)
    
    return {
        "total": total,
        "ativos": ativos,
        "inativos": total - ativos
    }

@router.get("/admins/list", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
async def listar_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ## 👑 Listar Administradores
    
    Lista todos os usuários com perfil admin.
    
    **Requer perfil ADMIN**
    
    ### Retorna:
    - Lista de administradores ativos
    
    ### Erros:
    - **401**: Token inválido
    - **403**: Usuário não é admin
    """
    admins = UserService.listar_admins(db)
    return admins

