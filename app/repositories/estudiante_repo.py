from app.core.database import Database
from app.models.estudiante import Estudiante

class EstudianteRepository:
    def __init__(self):
        # Composición: El repositorio instancia su propia conexión
        self.db = Database()

    def obtener_todos(self):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM estudiantes ORDER BY id ASC;")
        estudiantes = cursor.fetchall()
        conn.close()
        return estudiantes

    def obtener_por_id(self, estudiante_id: int):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM estudiantes WHERE id = %s;", (estudiante_id,))
        estudiante = cursor.fetchone()
        conn.close()
        return estudiante

    def crear(self, estudiante: Estudiante):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO estudiantes (nombre, grado, promedio) 
            VALUES (%s, %s, %s) RETURNING id;
        """
        cursor.execute(query, (estudiante.nombre, estudiante.grado, estudiante.promedio))
        nuevo_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        return nuevo_id

    def eliminar(self, estudiante_id: int):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM estudiantes WHERE id = %s RETURNING id;", (estudiante_id,))
        eliminado = cursor.fetchone()
        conn.commit()
        conn.close()
        return eliminado is not None

    def actualizar(self, estudiante_id: int, estudiante: Estudiante):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE estudiantes
            SET nombre = %s, grado = %s, promedio = %s
            WHERE id = %s
            RETURNING id;
        """
        cursor.execute(query, (estudiante.nombre, estudiante.grado, estudiante.promedio, estudiante_id))
        actualizado = cursor.fetchone()
        conn.commit()
        conn.close()
        return actualizado is not None