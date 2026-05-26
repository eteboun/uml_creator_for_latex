from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from py_backend.convert.converter import Converter
from py_backend.layout.components.uml import UML
from py_backend.layout.config import create_uml_config
from py_backend.layout import tikz as t
from dataclasses import dataclass, field

@dataclass
class Session:

    UMLs: dict[str, UML] = field(default_factory=dict, init=False)
    app: FastAPI = field(default_factory=FastAPI, init=False)
    allowed_origins: list[str] = field(default_factory=list)

    def __post_init__(self):
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=self.allowed_origins,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.register()

    def register(self):

        @self.app.post("/uml/create")
        def create_umls(data: dict):
            cmodels = Converter.run(data["code"])

            UMLs = [UML(config=create_uml_config('config.json'), c_model=cmodel) for cmodel in cmodels]
            self.UMLs.update({uml.id: uml for uml in UMLs})

            return [uml_.as_dict() for uml_ in UMLs]

        @self.app.post("/uml/update")
        def update_umls(data: list[dict]):
            for cfg in data:
                id_ = cfg.pop("id")
                self.UMLs[id_].update_uml(**cfg)

            return t.generate_tikz(list(self.UMLs.values()))

        @self.app.post("/uml/delete")
        def delete_umls(data: dict):
            id_ = data.pop("id")
            self.UMLs.pop(id_)

            return {"deleted": id_}

