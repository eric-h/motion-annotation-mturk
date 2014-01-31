copy .boto %USERPROFILE%\.boto
attrib +h %USERPROFILE%\.boto
util\elevate.exe setx -m BOTO_CONFIG "%USERPROFILE%\.boto"