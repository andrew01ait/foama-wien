"""Use the installed Java compiler, including slim JDK images without ct.sym."""
from pathlib import Path
import shutil

def java8_compiler(android=None):
    javac=shutil.which('javac')
    java=shutil.which('java')
    command=[javac] if javac else [java,'-m','jdk.compiler/com.sun.tools.javac.Main']
    home=Path(javac or java).resolve().parents[1]
    if (home/'lib/ct.sym').is_file():
        return command+['--release','8','-encoding','UTF-8']
    # The platform stubs omit LambdaMetafactory, so they cannot be a javac
    # bootclasspath. Android API compatibility is additionally exercised by the
    # mandatory Android tests and D8; all emitted classes still target Java 8.
    return command+['-source','8','-target','8','-encoding','UTF-8']
