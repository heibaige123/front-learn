# 文件夹名称
dir_name='node-lru-cache'
# git 地址
git_url='git@github.com:isaacs/node-lru-cache.git'
# 存储目录
# storage_dir='multi-packages/vue'
storage_dir='single-packages'

# 当前目录
current_path=$(pwd)
cd tmp
git clone $git_url $dir_name
cd $dir_name
# 获取主分支名称
branch_name=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $branch_name"
git filter-repo --path-rename "":"packages/$storage_dir/$dir_name/"
# 获取当前地址
sub_path=$(pwd)
cd $current_path
git remote add $dir_name $sub_path
git pull $dir_name
git merge --allow-unrelated-histories $dir_name/$branch_name
git branch -d $dir_name
rm -rf tmp/$dir_name
