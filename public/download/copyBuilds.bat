rmdir DemoStandAlone /S /Q
rmdir DemoUnity /S /Q

exit

mkdir ".\DemoStandAlone"
xcopy /E /Y "..\..\..\PlayVestedUnity\Demo Game\Build\PC" ".\DemoStandAlone"
mkdir ".\DemoUnity\Assets"
xcopy /E /Y "..\..\..\PlayVestedUnity\Demo Game\Assets" ".\DemoUnity\Assets"
mkdir ".\DemoUnity\Library"
xcopy /E /Y "..\..\..\PlayVestedUnity\Demo Game\Library" ".\DemoUnity\Library"
mkdir ".\DemoUnity\Packages"
xcopy /E /Y "..\..\..\PlayVestedUnity\Demo Game\Packages" ".\DemoUnity\Packages"
mkdir ".\DemoUnity\ProjectSettings"
xcopy /E /Y "..\..\..\PlayVestedUnity\Demo Game\ProjectSettings" ".\DemoUnity\ProjectSettings"
