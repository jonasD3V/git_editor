; Custom NSIS script — checks that Git is installed before proceeding.
; Injected by electron-builder via nsis.include.

!macro customInstall
  ; Check if git is available in PATH
  nsExec::ExecToStack 'git --version'
  Pop $0  ; exit code
  Pop $1  ; stdout

  ${If} $0 != 0
    MessageBox MB_YESNO|MB_ICONEXCLAMATION \
      "Git was not found on this system.$\n$\n\
Git GUI requires Git for Windows to be installed.$\n\
It also includes ssh-keygen for SSH key management.$\n$\n\
Open the Git for Windows download page now?" \
      IDYES openGitPage IDNO continueAnyway

    openGitPage:
      ExecShell "open" "https://git-scm.com/download/win"
      Abort  ; stop installation

    continueAnyway:
      ; user chose to continue without git — app will show error on startup
  ${EndIf}
!macroend

!macro customUnInstall
!macroend
