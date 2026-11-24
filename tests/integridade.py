import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class AtualizacaoBanco(unittest.TestCase):
    def test_atualiza_0018_preservando_biblioteca_e_fila(self):
        with sqlite3.connect(":memory:") as db:
            db.execute("PRAGMA foreign_keys = ON")
            migrations = sorted((ROOT / "migrations").glob("*.sql"))
            for migration in migrations:
                if migration.name[:4] <= "0018":
                    db.executescript(migration.read_text(encoding="utf-8"))
            leitor = db.execute("INSERT INTO leitores(nome) VALUES ('Leitor')").lastrowid
            inscrito = db.execute("INSERT INTO inscritos(email, origem, status, token) VALUES ('teste@example.com', 'rodape', 'ativo', 'teste')").lastrowid
            envio = db.execute("INSERT INTO envios(tipo, ref_id, titulo) VALUES ('artigo', 1, 'Teste')").lastrowid
            db.execute("INSERT INTO envio_destinos(envio_id, inscrito_id) VALUES (?,?)", (envio, inscrito))
            for migration in migrations:
                if migration.name[:4] > "0018":
                    db.executescript(migration.read_text(encoding="utf-8"))
            self.assertEqual(db.execute("SELECT nome FROM leitores WHERE id = ?", (leitor,)).fetchone(), ("Leitor",))
            self.assertEqual(db.execute("SELECT status, reserva FROM envio_destinos").fetchone(), ("fila", None))
            self.assertEqual(db.execute("PRAGMA foreign_key_check").fetchall(), [])


class IntegridadeBanco(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys = ON")
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            self.db.executescript(migration.read_text(encoding="utf-8"))
        self.produto = self.db.execute(
            "SELECT id FROM produtos WHERE slug = 'livro-igreja-do-fim'"
        ).fetchone()[0]
        self.db.execute("UPDATE produtos SET estoque = 1 WHERE id = ?", (self.produto,))

    def tearDown(self):
        self.db.close()

    def pedido(self, codigo, quantidade=1):
        pedido = self.db.execute(
            "INSERT INTO pedidos(codigo,chave,nome,email,subtotal,total) VALUES(?, 'chave', 'Teste', 'teste@example.com', 100, 100)",
            (codigo,),
        ).lastrowid
        self.db.execute(
            "INSERT INTO pedido_itens(pedido_id,produto_id,nome,preco,quantidade) VALUES(?, ?, 'Livro', 100, ?)",
            (pedido, self.produto, quantidade),
        )
        return pedido

    def mover(self, pedido, baixa):
        self.db.execute(
            "UPDATE pedidos SET status = ?, estoque_baixado = ?, motivo_estoque = 'Teste' WHERE id = ?",
            ("pago" if baixa else "reembolsado", baixa, pedido),
        )

    def saldo(self):
        return self.db.execute("SELECT estoque FROM produtos WHERE id = ?", (self.produto,)).fetchone()[0]

    def test_aprovacao_e_estorno_repetidos(self):
        pedido = self.pedido("A")
        self.mover(pedido, 1)
        self.mover(pedido, 1)
        self.assertEqual(self.saldo(), 0)
        self.mover(pedido, 0)
        self.mover(pedido, 0)
        self.assertEqual(self.saldo(), 1)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM estoque_movimentos").fetchone()[0], 2)

    def test_ultima_unidade_e_status_atomico(self):
        primeiro, segundo = self.pedido("A"), self.pedido("B")
        self.mover(primeiro, 1)
        with self.assertRaisesRegex(sqlite3.IntegrityError, "PV_ESTOQUE_INSUFICIENTE"):
            self.mover(segundo, 1)
        self.assertEqual(self.saldo(), 0)
        self.assertEqual(self.db.execute("SELECT status FROM pedidos WHERE id = ?", (segundo,)).fetchone()[0], "aguardando")

    def test_variacao_com_linhas_repetidas(self):
        pedido = self.pedido("A")
        variacao, produto = self.db.execute("SELECT id, produto_id FROM produto_variacoes LIMIT 1").fetchone()
        self.db.execute("UPDATE produto_variacoes SET estoque = 1 WHERE id = ?", (variacao,))
        self.db.execute("DELETE FROM pedido_itens WHERE pedido_id = ?", (pedido,))
        self.db.executemany(
            "INSERT INTO pedido_itens(pedido_id,produto_id,variacao_id,nome,variacao,preco,quantidade) VALUES(?, ?, ?, 'Camiseta', 'P', 100, 1)",
            [(pedido, produto, variacao)] * 2,
        )
        with self.assertRaisesRegex(sqlite3.IntegrityError, "PV_ESTOQUE_INSUFICIENTE"):
            self.mover(pedido, 1)
        self.assertEqual(self.db.execute("SELECT estoque FROM produto_variacoes WHERE id = ?", (variacao,)).fetchone()[0], 1)

    def test_endereco_anterior_do_artigo(self):
        self.db.execute("UPDATE artigos SET slug = 'novo' WHERE slug = 'price-escolas-filhos-profetas'")
        encontrado = self.db.execute(
            "SELECT a.slug FROM artigos_enderecos e JOIN artigos a ON a.id = e.artigo_id WHERE e.slug = ?",
            ("price-escolas-filhos-profetas",),
        ).fetchone()
        self.assertEqual(encontrado, ("novo",))


if __name__ == "__main__":
    unittest.main()
