from .models import Auditoria


class AuditoriaService:

    @staticmethod
    def registrar(
        usuario,
        entidad,
        entidad_id,
        accion,
        motivo=None,
        valores_anteriores=None,
        valores_nuevos=None,
    ):
        return Auditoria.objects.create(
            usuario=usuario,
            entidad=entidad,
            entidad_id=str(entidad_id),
            accion=accion,
            motivo=motivo,
            valores_anteriores=valores_anteriores,
            valores_nuevos=valores_nuevos,
        )