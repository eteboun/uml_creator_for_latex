from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from py_backend.convert.converter import Converter
from py_backend.layout.components.uml import UML
from py_backend.layout.config import create_uml_config

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/uml")
def send_uml(data: dict):
    cmodels = Converter.run(data["code"])
    base_cfg = create_uml_config('config.json')

    UMLs = [UML(config=base_cfg, c_model=cmodel) for cmodel in cmodels]
    return [uml_.as_dict() for uml_ in UMLs]
