# N-Body Problem Simulator
N体問題を解くためのPythonプログラムを作る。

## N体問題とは
相互作用する複数の物体の挙動は、解析的に求められないということが分かっている。
そこで、数値計算によって求める。

## 進捗
一応計算の実装は完了。Pythonが異常に遅い。Javascriptが予想以上に健闘している。

100体で100ステップ計算した結果は以下の通り。
- Python: 13500ms
- Python + C++(OpenMPで並列化): 15ms
- Javascript: 150ms

## C++ソースのビルド方法 (WSL + Ubuntu 18.04)
```
sudo apt install python3-dev libboost-python-dev
./compile.sh
```

## 参考文献
[N体問題で有名な牧野先生が作ったPDF](http://www.cfca.nao.ac.jp/~cfca/hpc/muv/text/makino_07.pdf)

[N体問題で有名な牧野先生が作ったPDF2](https://www2.ccs.tsukuba.ac.jp/algorithm-ws/pdf/1-1-makino.pdf)

[北里大学の数値計算の講義の資料っぽい](https://www.kitasato-u.ac.jp/sci/resea/buturi/hisenkei/sogo/sanpou07.pdf)

