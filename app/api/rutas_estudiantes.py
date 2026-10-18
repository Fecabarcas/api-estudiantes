from fastapi import APIRouter, HTTPException
from app.models.estudiante import Estudiante
from app.repositories.estudiante_repo import EstudianteRepository

router = APIRouter(prefix="/estudiantes", tags=["Gestión de Estudiantes"])
repo = EstudianteRepository()

@router.get("/")
def listar_estudiantes():
    return repo.obtener_todos()

@router.get("/{estudiante_id}")
def obtener_estudiante(estudiante_id: int):
    estudiante = repo.obtener_por_id(estudiante_id)
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return estudiante

@router.post("/")
def crear_estudiante(estudiante: Estudiante):
    nuevo_id = repo.crear(estudiante)
    return {"mensaje": "Estudiante registrado exitosamente", "id": nuevo_id}

@router.delete("/{estudiante_id}")
def eliminar_estudiante(estudiante_id: int):
    exito = repo.eliminar(estudiante_id)
    if not exito:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return {"mensaje": "Estudiante eliminado correctamente"}

@router.put("/{estudiante_id}")
def actualizar_estudiante(estudiante_id: int, estudiante: Estudiante):
    exito = repo.actualizar(estudiante_id, estudiante)
    if not exito:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return {"mensaje": "Estudiante actualizado correctamente"}