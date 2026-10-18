from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  # AGREGADO: necesario para servir el frontend
from app.api import rutas_estudiantes

app = FastAPI(
    title="API de Desempeño Estudiantil",
    description="Backend modular para monitoreo académico usando FastAPI y PostgreSQL puro",
    version="1.0.0"
)

# Conectamos el módulo de rutas a la aplicación principal
app.include_router(rutas_estudiantes.router)

@app.get("/")
def estado_api():
    return {"mensaje": "La API de monitoreo se encuentra en línea y funcional"}


# ==================== AGREGADO POR MÍ ====================
# Interfaz visual (frontend): sirve la carpeta "frontend" en /interfaz
app.mount("/interfaz", StaticFiles(directory="frontend", html=True), name="interfaz")
# ========================================================