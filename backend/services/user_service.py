"""
Serviço de Usuários
Contém a lógica de negócio para CRUD completo de usuários
"""
from sqlalchemy.orm import Session
from backend.models.user import User, PerfilEnum
from backend.schemas.user_schema import UserCreate, UserUpdate, UserChangePassword
from backend.utils.security import hash_password, verify_password
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

class UserService:
    """
    Serviço de gerenciamento de usuários
    """
    
    @staticmethod
    def criar_usuario(db: Session, user_data: UserCreate, criado_por_id: str) -> User:
        """
        Cria novo usuário no sistema
        
        Args:
            db: Sessão do banco de dados
            user_data: Dados do novo usuário
            criado_por_id: ID do usuário que está criando (admin)
        
        Returns:
            User: Usuário criado
        
        Raises:
            HTTPException 400: Username, email ou CPF já cadastrado
        
        Exemplo:
            >>> user_data = UserCreate(
            ...     nome_completo="João Silva",
            ...     username="joao",
            ...     email="joao@empresa.com",
            ...     empresa="Empresa X",
            ...     cpf="12345678909",
            ...     perfil="user",
            ...     senha="Senha@123"
            ... )
            >>> novo_usuario = UserService.criar_usuario(db, user_data, admin_id)
        """
        # Verificar se username já existe
        username_exists = db.query(User).filter(
            User.username == user_data.username.lower()
        ).first()
        
        if username_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_data.username}' já está cadastrado",
            )
        
        # Verificar se email já existe
        email_exists = db.query(User).filter(
            User.email == user_data.email.lower()
        ).first()
        
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_data.email}' já está cadastrado",
            )
        
        # Verificar se CPF já existe
        cpf_limpo = ''.join(filter(str.isdigit, user_data.cpf))
        cpf_exists = db.query(User).filter(User.cpf == cpf_limpo).first()
        
        if cpf_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já está cadastrado",
            )
        
        # Criar novo usuário
        novo_usuario = User(
            id=str(uuid.uuid4()),
            nome_completo=user_data.nome_completo,
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            empresa=user_data.empresa,
            cpf=cpf_limpo,
            senha_hash=hash_password(user_data.senha),
            perfil=user_data.perfil,
            criado_por=criado_por_id
        )
        
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        
        return novo_usuario
    
    @staticmethod
    def listar_usuarios(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        apenas_ativos: bool = False
    ) -> List[User]:
        """
        Lista todos os usuários
        
        Args:
            db: Sessão do banco de dados
            skip: Número de registros a pular (paginação)
            limit: Número máximo de registros a retornar
            apenas_ativos: Se True, retorna apenas usuários ativos
        
        Returns:
            List[User]: Lista de usuários
        
        Exemplo:
            >>> usuarios = UserService.listar_usuarios(db, skip=0, limit=10)
            >>> print(len(usuarios))
        """
        query = db.query(User)
        
        if apenas_ativos:
            query = query.filter(User.ativo == True)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def obter_usuario(db: Session, user_id: str) -> User:
        """
        Obtém usuário por ID
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
        
        Returns:
            User: Objeto do usuário
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> user = UserService.obter_usuario(db, "123e4567...")
            >>> print(user.nome_completo)
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        return user
    
    @staticmethod
    def obter_usuario_por_username(db: Session, username: str) -> Optional[User]:
        """
        Obtém usuário por username
        
        Args:
            db: Sessão do banco de dados
            username: Username do usuário
        
        Returns:
            Optional[User]: Objeto do usuário ou None
        
        Exemplo:
            >>> user = UserService.obter_usuario_por_username(db, "admin")
        """
        return db.query(User).filter(
            User.username == username.lower()
        ).first()
    
    @staticmethod
    def atualizar_usuario(db: Session, user_id: str, user_data: UserUpdate) -> User:
        """
        Atualiza dados do usuário
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            user_data: Dados a serem atualizados
        
        Returns:
            User: Usuário atualizado
        
        Raises:
            HTTPException 404: Usuário não encontrado
            HTTPException 400: Email já cadastrado por outro usuário
        
        Exemplo:
            >>> user_data = UserUpdate(nome_completo="Novo Nome")
            >>> user = UserService.atualizar_usuario(db, user_id, user_data)
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        # Verificar se email está sendo alterado e se já existe
        if user_data.email and user_data.email != user.email:
            email_exists = db.query(User).filter(
                User.email == user_data.email.lower(),
                User.id != user_id
            ).first()
            
            if email_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{user_data.email}' já está cadastrado",
                )
        
        # Atualizar apenas campos fornecidos
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                setattr(user, field, value.lower())
            else:
                setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def alterar_senha(db: Session, user_id: str, senha_data: UserChangePassword) -> bool:
        """
        Altera senha do usuário
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            senha_data: Dados de alteração de senha (senha_atual, senha_nova)
        
        Returns:
            bool: True se senha alterada com sucesso
        
        Raises:
            HTTPException 404: Usuário não encontrado
            HTTPException 400: Senha atual incorreta
        
        Exemplo:
            >>> senha_data = UserChangePassword(
            ...     senha_atual="SenhaAntiga@123",
            ...     senha_nova="SenhaNova@456"
            ... )
            >>> UserService.alterar_senha(db, user_id, senha_data)
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        # Verificar senha atual
        if not verify_password(senha_data.senha_atual, user.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta",
            )
        
        # Atualizar senha
        user.senha_hash = hash_password(senha_data.senha_nova)
        db.commit()
        
        return True
    
    @staticmethod
    def resetar_senha_admin(db: Session, user_id: str, nova_senha: str) -> bool:
        """
        Reseta senha do usuário (apenas admin)
        Não requer senha atual
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            nova_senha: Nova senha
        
        Returns:
            bool: True se senha resetada com sucesso
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> UserService.resetar_senha_admin(db, user_id, "NovaSenha@123")
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        # Atualizar senha sem verificar a antiga
        user.senha_hash = hash_password(nova_senha)
        db.commit()
        
        return True
    
    @staticmethod
    def desativar_usuario(db: Session, user_id: str) -> User:
        """
        Desativa usuário (não deleta, apenas marca como inativo)
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
        
        Returns:
            User: Usuário desativado
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> user = UserService.desativar_usuario(db, user_id)
            >>> print(user.ativo)  # False
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        user.ativo = False
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def ativar_usuario(db: Session, user_id: str) -> User:
        """
        Reativa usuário
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
        
        Returns:
            User: Usuário ativado
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> user = UserService.ativar_usuario(db, user_id)
            >>> print(user.ativo)  # True
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        user.ativo = True
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def deletar_usuario(db: Session, user_id: str) -> bool:
        """
        Deleta usuário permanentemente do banco de dados
        ⚠️ USO CUIDADOSO: Esta ação é irreversível!
        Recomenda-se usar desativar_usuario() em vez disso
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
        
        Returns:
            bool: True se deletado com sucesso
        
        Raises:
            HTTPException 404: Usuário não encontrado
        
        Exemplo:
            >>> UserService.deletar_usuario(db, user_id)
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        
        db.delete(user)
        db.commit()
        
        return True
    
    @staticmethod
    def contar_usuarios(db: Session, apenas_ativos: bool = False) -> int:
        """
        Conta número total de usuários
        
        Args:
            db: Sessão do banco de dados
            apenas_ativos: Se True, conta apenas usuários ativos
        
        Returns:
            int: Número de usuários
        
        Exemplo:
            >>> total = UserService.contar_usuarios(db)
            >>> ativos = UserService.contar_usuarios(db, apenas_ativos=True)
        """
        query = db.query(User)
        
        if apenas_ativos:
            query = query.filter(User.ativo == True)
        
        return query.count()
    
    @staticmethod
    def listar_admins(db: Session) -> List[User]:
        """
        Lista todos os usuários com perfil admin
        
        Args:
            db: Sessão do banco de dados
        
        Returns:
            List[User]: Lista de administradores
        
        Exemplo:
            >>> admins = UserService.listar_admins(db)
        """
        return db.query(User).filter(
            User.perfil == PerfilEnum.ADMIN,
            User.ativo == True
        ).all()

