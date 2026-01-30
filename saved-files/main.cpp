#include <iostream>
using namespace std;

struct Node{
    int value;
    Node* next;
    Node(int x):value(x),next(nullptr){};
};


class TreeNode{ //链表的数据结构
public:
    int v;  //成员变量
    TreeNode *left;
    TreeNode *right;
    //构造函数
    TreeNode(int x):v(x),left(nullptr),right(nullptr){};

    void preOrder(TreeNode *root){
        if(root == nullptr) return;
        cout<<root->v<<' '; //前序
        preOrder(root->left);
        preOrder(root->right);
    }

    void inOrder(TreeNode *root){
        if(root == nullptr) return;
        inOrder(root->left);
        cout<<root->v<<' ';
        inOrder(root->right);
    }

    void postOrder(TreeNode *root){
        if(root == nullptr) return;
        postOrder(root->left);
        postOrder(root->right);
        cout<<root->v<<' ';
    }

    int cntNodes(TreeNode* root){
        if(root == nullptr) return 0;
        return 1 + cntNodes(root->left) + cntNodes(root->right);
    }

    int cntDepth(TreeNode* root){
        if(root == nullptr) return 0;
        return 1 + max(cntDepth(root->left),cntDepth(root->right));
    }

    int cntLeafNodes(TreeNode* root){
        if(root == nullptr) return 0;
        if(root->left == nullptr && root->right == nullptr) return 1;
        return cntLeafNodes(root->left) + cntLeafNodes(root->right);
    }
};

int main() {
    TreeNode *root = new TreeNode(1);
    root->left = new TreeNode(2);
    root->right = new TreeNode(3);
    root->left->left = new TreeNode(4);
    root->left->right = new TreeNode(5);
    root->left->left->left = new TreeNode(6);
    root->left->left->right = new TreeNode(7);
    root->right->left = new TreeNode(8);
    root->right->left->right = new TreeNode(9);

    root->postOrder(root);
    cout<<endl;
    cout<<root->cntNodes(root)<<endl;
    cout<<root->cntDepth(root)<<endl;
    return 0;
}