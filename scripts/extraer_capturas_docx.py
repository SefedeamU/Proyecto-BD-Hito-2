#!/usr/bin/env python3
"""
Extrae las capturas del experimento desde el .docx del compañero y las organiza
en una jerarquía de carpetas por escenario (sin/con índices), base de datos
(1k/10k/100k/1m) y consulta (1..4).

El documento está estructurado de forma regular:

    Sin Índices
        1K
            Consulta 1   -> 4 imágenes
            Consulta 2   -> 4 imágenes
            ...
        10K ...
    Con Índices
        ...

y por cada (escenario, base, consulta) hay 4 capturas, en este orden:
    1) query + resultados (Data Output, con el tiempo)
    2) plan gráfico (pestaña Explain > Graphical)
    3) análisis de nodos (Explain > Analysis)
    4) estadísticas (Explain > Statistics)

Uso:
    python3 extraer_capturas_docx.py [RUTA_DOCX] [DIR_SALIDA]

Por defecto extrae a un directorio temporal junto al .docx.
"""
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

# Rol de cada una de las 4 capturas dentro de una celda (en orden de aparición).
ROLES = ["1_resultados", "2_plan", "3_analisis", "4_estadisticas"]

DB_NORM = {"1K": "1k", "10K": "10k", "100K": "100k", "1M": "1m"}


def texto(p):
    return "".join(t.text or "" for t in p.iter(W + "t")).strip()


def imagenes(p, rid2media):
    out = []
    for blip in p.iter(A + "blip"):
        rid = blip.get(R + "embed")
        if rid and rid in rid2media:
            out.append(rid2media[rid])
    return out


def main():
    docx = sys.argv[1] if len(sys.argv) > 1 else \
        "/home/sefedeam/Descargas/BD1 Proyecto Final Optimizacion Capturas.docx"
    out = sys.argv[2] if len(sys.argv) > 2 else \
        os.path.join(os.path.dirname(docx), "capturas_extraidas")

    z = zipfile.ZipFile(docx)
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
    rid2media = {m.group(1): "word/" + m.group(2)
                 for m in re.finditer(r'Id="([^"]+)"[^>]*Target="(media/[^"]+)"', rels)}

    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")

    escenario = db = None
    consulta = None
    contador = 0          # cuántas imágenes llevamos en la celda actual
    guardadas = 0
    huérfanas = 0

    for p in body.iter(W + "p"):
        t = texto(p)
        if t:
            low = t.lower()
            if low.startswith("sin índices") or low.startswith("sin indices"):
                escenario = "sin_indices"
            elif low.startswith("con índices") or low.startswith("con indices"):
                escenario = "con_indices"
            elif t in DB_NORM:
                db = DB_NORM[t]
            else:
                m = re.match(r"consulta\s*([1-4])", low)
                if m:
                    consulta = m.group(1)
                    contador = 0

        for media in imagenes(p, rid2media):
            if not (escenario and db and consulta):
                huérfanas += 1
                continue
            role = ROLES[contador] if contador < len(ROLES) else f"{contador+1}_extra"
            destino = os.path.join(out, escenario, db, f"consulta_{consulta}")
            os.makedirs(destino, exist_ok=True)
            with open(os.path.join(destino, role + ".png"), "wb") as fh:
                fh.write(z.read(media))
            contador += 1
            guardadas += 1

    print(f"Imágenes guardadas: {guardadas}")
    if huérfanas:
        print(f"Imágenes sin contexto (ignoradas): {huérfanas}")
    print(f"Salida: {out}")


if __name__ == "__main__":
    main()
