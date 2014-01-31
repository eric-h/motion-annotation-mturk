from distutils.core import setup
import py2exe, sys, os
import matplotlib

sys.argv.append('py2exe')

setup(
    options = { "py2exe": {
        'includes':  ["sip",
                      "PyQt4.QtGui",
                      "matplotlib.backends.backend_tkagg"],
        #'bundle_files': 2,
        #'compressed': 2, 
        'dll_excludes': ['w9xpopen.exe']}},
    console = [{
        'script': "mturkclient.py",
        }],
    zipfile = r"shared.lib",
    data_files=matplotlib.get_py2exe_datafiles(),
)
