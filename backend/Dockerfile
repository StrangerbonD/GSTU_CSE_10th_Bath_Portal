# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for layer caching
COPY GstuPortal.sln ./
COPY src/GstuPortal.Domain/GstuPortal.Domain.csproj src/GstuPortal.Domain/
COPY src/GstuPortal.Application/GstuPortal.Application.csproj src/GstuPortal.Application/
COPY src/GstuPortal.Infrastructure/GstuPortal.Infrastructure.csproj src/GstuPortal.Infrastructure/
COPY src/GstuPortal.WebApi/GstuPortal.WebApi.csproj src/GstuPortal.WebApi/
COPY tests/GstuPortal.IntegrationTests/GstuPortal.IntegrationTests.csproj tests/GstuPortal.IntegrationTests/

# Restore
RUN dotnet restore src/GstuPortal.WebApi/GstuPortal.WebApi.csproj

# Copy full source and publish
COPY . ./
RUN dotnet publish src/GstuPortal.WebApi/GstuPortal.WebApi.csproj -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GstuPortal.WebApi.dll"]
