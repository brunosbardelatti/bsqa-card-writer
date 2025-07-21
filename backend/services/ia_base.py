from abc import ABC, abstractmethod

class IAServiceBase(ABC):
    @abstractmethod
    def generate_response(self, prompt: str, **kwargs):
        pass 