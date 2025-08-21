-- Adding new estados for completed appointments
-- Agregar comentario para documentar los nuevos estados de turnos
COMMENT ON COLUMN turnos.estado IS 'Estados posibles: reservado, confirmado, reprogramado, cancelado, asistio, no_asistio_con_justificativo, no_asistio_sin_justificativo, cancelado_paciente, cancelado_consultorio';

-- No necesitamos modificar la estructura ya que es character varying
-- Solo documentamos los nuevos valores posibles
