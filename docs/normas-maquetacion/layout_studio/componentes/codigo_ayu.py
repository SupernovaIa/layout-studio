"""Bloque de código estilo Ayu Mirage con botón «Copiar» (HTML autocontenido, sin dependencias).
Uso: python3 codigo_ayu.py   -> genera layout_studio/componentes/bloque_codigo_ayu_mirage.html (demo)
     from codigo_ayu import bloque_codigo; html = bloque_codigo(codigo, "kotlin")"""
import html as H,sys,pathlib
from pygments import highlight
from pygments.lexers import get_lexer_by_name,guess_lexer
from pygments.formatters import HtmlFormatter
from pygments.style import Style
from pygments.token import (Comment,Keyword,Name,String,Number,Operator,Punctuation,Generic,Text,Error)
class AyuMirage(Style):
    background_color="#1F2430"
    styles={Text:"#CBCCC6",Error:"#FF3333",Comment:"italic #5C6773",Comment.Preproc:"#FFA759",Keyword:"#FFA759",Keyword.Constant:"#FFA759",Keyword.Type:"#FFD580",Name:"#CBCCC6",Name.Function:"#FFD580",Name.Class:"#FFD580",Name.Builtin:"#FFD580",Name.Decorator:"#FFD580",Name.Attribute:"#FFD580",Name.Tag:"#FFD580",Name.Constant:"#FFCC66",String:"#BAE67E",String.Escape:"#95E6CB",Number:"#FFCC66",Operator:"#FFCC66",Punctuation:"#CBCCC6",Generic.Heading:"#FFD580",Generic.Deleted:"#FF3333",Generic.Inserted:"#BAE67E"}
CSS="""
.code-block{position:relative;margin:0 0 16px;border-radius:7px;background:#1F2430;box-shadow:0 1.5px 4px rgba(0,0,0,.20);font-family:'JetBrains Mono',Menlo,Consolas,'Courier New',monospace;overflow:hidden}
.code-block .cb-bar{display:flex;align-items:center;justify-content:space-between;padding:7px 10px 0 14px;min-height:30px}
.code-block .cb-lang{font:600 10.5px/1 'Poppins',Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#FFCC66}
.code-block .cb-copy{display:inline-flex;align-items:center;gap:6px;border:1px solid #5C6773;border-radius:6px;background:transparent;color:#CBCCC6;font:500 12px/1 'Poppins',Arial,sans-serif;padding:6px 10px;cursor:pointer}
.code-block .cb-copy:hover{background:#2A3142;border-color:#CBCCC6}
.code-block .cb-copy:focus-visible{outline:2px solid #FFCC66;outline-offset:2px}
.code-block .cb-copy svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.code-block .cb-copy.ok{color:#BAE67E;border-color:#BAE67E}
.code-block pre{margin:0;padding:8px 16px 14px;color:#CBCCC6;font-size:13px;line-height:1.55;overflow-x:auto;white-space:pre;tab-size:4}
.code-block pre code{font:inherit}
"""
JS="""
<script>
document.addEventListener('click',function(e){var b=e.target.closest('.cb-copy');if(!b)return;
var code=b.closest('.code-block').querySelector('pre').innerText.replace(/\\n$/,'');
function ok(){var t=b.querySelector('.cb-txt'),o=t.textContent;b.classList.add('ok');t.textContent='¡Copiado!';setTimeout(function(){b.classList.remove('ok');t.textContent=o},1600)}
function fb(){var a=document.createElement('textarea');a.value=code;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();var r=false;try{r=document.execCommand('copy')}catch(_){}document.body.removeChild(a);if(r)ok()}
if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(code).then(ok,fb)}else{fb()}});
</script>"""
ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
def bloque_codigo(code,lang=None,copiado=False):
    try: lx=get_lexer_by_name(lang) if lang else guess_lexer(code)
    except Exception: lx=get_lexer_by_name("text")
    body=highlight(code.strip("\n"),lx,HtmlFormatter(style=AyuMirage,noclasses=True,nowrap=True))
    etq=(lang or "código").upper()
    return f'<div class="code-block"><div class="cb-bar"><span class="cb-lang">{H.escape(etq)}</span><button type="button" class="cb-copy{" ok" if copiado else ""}" aria-label="Copiar el código al portapapeles">{ICON}<span class="cb-txt">{"¡Copiado!" if copiado else "Copiar"}</span></button></div><pre><code>{body}</code></pre></div>'
def pagina(bloques,titulo="Bloque de código"):
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{H.escape(titulo)}</title><style>body{{margin:24px;background:#fff;font:400 15px/1.6 Poppins,Arial,sans-serif;color:#1A1A1A}}{CSS}</style></head><body>{"".join(bloques)}{JS}</body></html>'
if __name__=="__main__":
    kt='''private fun registrarEvento(mensaje: String) {
   Log.d(TAG, mensaje)        // consola Logcat
   historialEventos.add(mensaje)
}'''
    xm='''<uses-permission android:name="android.permission.INTERNET" />
<application android:icon="@mipmap/ic_launcher">
    <activity android:name=".MainActivity" />
</application>'''
    out=pathlib.Path(__file__).resolve().parent.parent/"layout_studio"/"componentes"
    (out/"bloque_codigo_ayu_mirage.html").write_text(pagina([bloque_codigo(kt,"kotlin"),bloque_codigo(xm,"xml")]),encoding="utf8")
    (out/"_estado_copiado.html").write_text(pagina([bloque_codigo(kt,"kotlin",copiado=True)]),encoding="utf8")
    print("ok")
