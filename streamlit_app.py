import streamlit as st
import pandas as pd
import plotly.express as px
import math

st.set_page_config(page_title="度数分布表とヒストグラム作成アプリ", layout="wide")

st.title("度数分布表とヒストグラム作成アプリ")
st.caption("Created by Dit-Lab.(Daiki Ito)")
st.write("アップロードしたExcelやCSVデータから、度数分布表とヒストグラムを作成します。")
st.write("")

# ファイルアップローダー
uploaded_file = st.file_uploader('ファイルをアップロードしてください (Excel or CSV)', type=['xlsx', 'csv'])

# デモデータを使うかどうかのチェックボックス
use_demo_data = st.checkbox('デモデータを使用')

# データフレームの作成
df = None
if use_demo_data:
    try:
        df = pd.read_excel('hist_data.xlsx', sheet_name=0)
        st.write("デモデータを使用しています。")
        st.write(df.head())
    except FileNotFoundError:
        st.error("デモデータファイル 'hist_data.xlsx' が見つかりません。デモデータを使用できません。")
elif uploaded_file is not None:
    try:
        if uploaded_file.type == 'text/csv':
            df = pd.read_csv(uploaded_file)
            st.write(df.head())
        else:
            df = pd.read_excel(uploaded_file)
            st.write(df.head())
    except Exception as e:
        st.error(f"ファイルの読み込み中にエラーが発生しました: {e}")
else:
    st.write('ファイルをアップロードするか、デモデータを使用してください。')

if df is not None:
    # 数値変数のリストを取得
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    if numerical_cols:
        st.subheader('数値変数の選択')
        selected_col = st.selectbox('度数分布表とヒストグラムを作成する数値変数を選択してください', numerical_cols)
        
        # 階級数を自動で決定（Sturges' formula）
        n = len(df[selected_col].dropna())
        bin_num = math.ceil(1 + math.log2(n))
        
        st.write(f"自動的に決定された階級の数: {bin_num}")
        
        # 度数分布表の作成
        st.subheader(f'度数分布表：{selected_col}')
        
        # pd.cutでビンを作成し、カスタムラベルを設定
        counts, bins = pd.cut(df[selected_col], bins=bin_num, retbins=True, include_lowest=True)
        
        # カスタムラベルの作成
        bin_labels = [f"{round(bins[i], 2)}～{round(bins[i+1], 2)}" for i in range(len(bins)-1)]
        
        counts = pd.cut(df[selected_col], bins=bin_num, labels=bin_labels, include_lowest=True)
        freq_table = counts.value_counts().sort_index()
        freq_table = freq_table.reset_index()
        freq_table.columns = ['区間', '度数']
        
        # インデックスを1から開始するように調整
        freq_table.index = range(1, len(freq_table) + 1)
        
        st.write(freq_table)
        
        # ヒストグラムの作成
        st.subheader(f'ヒストグラム：{selected_col}')
        fig = px.histogram(df, x=selected_col, nbins=bin_num, title=f'ヒストグラム：{selected_col}')
        st.plotly_chart(fig)
    else:
        st.write('数値変数が含まれていません。')
