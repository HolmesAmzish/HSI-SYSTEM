package cn.arorms.hsi.server.enums

enum class FileType(val path: String) {
    HSI_MAT("mat/hsi"),
    HSI_BIN("bin/hsi"),
    GT_MAT("mat/gt"),
    GT_BIN("bin/gt");
}