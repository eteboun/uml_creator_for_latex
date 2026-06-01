from api.session import Session

session = Session(
    allowed_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.35.76:5173",
    ]
)