ALTER TABLE envio_destinos ADD COLUMN reserva TEXT;
ALTER TABLE envio_destinos ADD COLUMN reservado_em TEXT;
CREATE INDEX envio_destinos_reserva ON envio_destinos(reserva) WHERE reserva IS NOT NULL;
