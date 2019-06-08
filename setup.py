#!/usr/bin/python3

from distutils.core import setup, Extension

setup(name="calc", version="1.0", ext_modules=[
      Extension("calc", ["Force.cpp"])])
