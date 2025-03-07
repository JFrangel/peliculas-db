const repoOwner = "JFrangel";
const repoName = "peliculas-db";
const jsonFilePath = "movies.json";
const accessToken = "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";   // ¡Reemplázalo con tu token real!

document.addEventListener('DOMContentLoaded', async function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const searchContainer = document.querySelector('.search-container');
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.querySelector('.search-container button');

    // Funcionalidad del menú hamburguesa
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function (event) {
            navMenu.classList.toggle('active');
            event.stopPropagation();
        });
        document.addEventListener('click', function (event) {
            if (!menuToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });
    }

    // Funcionalidad de la barra de búsqueda en pantallas pequeñas
    if (searchButton && searchBar) {
        searchButton.addEventListener('click', function (event) {
            searchBar.style.display = 'block';
            searchBar.focus();
            event.stopPropagation();
        });
        document.addEventListener('click', function (event) {
            if (!searchContainer.contains(event.target)) {
                searchBar.style.display = 'none';
            }
        });
        searchBar.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    }

    // Funcionalidad para agregar películas (en agregar.html)
    if (window.location.pathname.includes('agregar.html')) {
        document.getElementById('add-movie-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const imageUrl = document.getElementById('image-url').value;
            const movieName = document.getElementById('movie-name').value;
            const type = document.getElementById('type').value;
            const genre = document.getElementById('genre').value;
            const movieUrl = document.getElementById('movie-url').value;

            if (!imageUrl || !movieName || !movieUrl) {
                alert("Por favor, completa todos los campos.");
                return;
            }

            const movieData = { imageUrl, movieName, type, genre, movieUrl };
            await updateMovies(movieData);
            alert("Película o serie agregada correctamente.");
            window.location.href = 'index.html';
        });

        document.getElementById('image-url').addEventListener('input', function () {
            document.getElementById('preview-image').src = this.value;
            document.getElementById('preview-image').style.display = "block";
        });
        document.getElementById('movie-name').addEventListener('input', function () {
            document.getElementById('preview-title').textContent = this.value;
        });
        document.getElementById('type').addEventListener('change', function () {
            document.getElementById('preview-label').textContent = this.value === 'pelicula' ? 'PELÍCULA' : 'SERIE';
        });
    } else {
        // En index.html, cargar y mostrar películas
        const movieContainer = document.getElementById('my-biblioteca');
        let movies = await fetchMovies();

        function renderMovies(filteredMovies) {
            movieContainer.innerHTML = '';
            filteredMovies.forEach(movie => {
                const movieItem = document.createElement('div');
                movieItem.classList.add('film-item');

                const movieLink = document.createElement('a');
                movieLink.href = movie.movieUrl;
                movieLink.target = "_blank";

                const movieImage = document.createElement('img');
                movieImage.src = movie.imageUrl;
                movieImage.alt = movie.movieName;

                const movieInfo = document.createElement('div');
                movieInfo.classList.add('film-info');

                const movieTitle = document.createElement('h2');
                movieTitle.textContent = movie.movieName;

                const movieLabel = document.createElement('span');
                movieLabel.classList.add('movie-label');
                movieLabel.textContent = movie.type === 'pelicula' ? 'PELÍCULA' : 'SERIE';

                movieInfo.appendChild(movieLabel);
                movieInfo.appendChild(movieTitle);
                movieLink.appendChild(movieImage);
                movieLink.appendChild(movieInfo);
                movieItem.appendChild(movieLink);

                movieContainer.appendChild(movieItem);
            });
        }

        renderMovies(movies);

        const searchInput = document.getElementById('search-movie');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const searchText = searchInput.value.toLowerCase();
                const filteredMovies = movies.filter(movie => movie.movieName.toLowerCase().includes(searchText));
                renderMovies(filteredMovies);
            });
        }

        document.querySelectorAll('.nav-menu li').forEach(li => {
            li.addEventListener('click', function () {
                const selectedGenre = this.dataset.category.toLowerCase();
                const filteredMovies = selectedGenre ? movies.filter(movie => movie.genre.toLowerCase() === selectedGenre) : movies;
                renderMovies(filteredMovies);
            });
        });
    }

    // Funcionalidad para eliminar películas
    const deleteForm = document.getElementById('delete-movie-form');
    if (deleteForm) {
        const deleteInput = document.getElementById('delete-movie-name');
        
        // Previsualización al eliminar
        const deletePreviewImage = document.getElementById('delete-preview-image');
        const deletePreviewTitle = document.getElementById('delete-preview-title');
        
        if(deleteInput) {
            deleteInput.addEventListener('input', async function () {
                let movies = await fetchMovies();
                if(deleteInput.value.trim().toLowerCase() === 'todas'){
                    if(deletePreviewImage) {
                        deletePreviewImage.src = '';
                        deletePreviewImage.style.display = 'none';
                    }
                    if(deletePreviewTitle) {
                        deletePreviewTitle.textContent = 'Se eliminarán todas las películas';
                    }
                } else {
                    let foundMovie = movies.find(movie => movie.movieName.toLowerCase() === deleteInput.value.toLowerCase());
                    if(foundMovie) {
                        if(deletePreviewImage) {
                            deletePreviewImage.src = foundMovie.imageUrl;
                            deletePreviewImage.style.display = 'block';
                        }
                        if(deletePreviewTitle) {
                            deletePreviewTitle.textContent = foundMovie.movieName;
                        }
                    } else {
                        if(deletePreviewImage) {
                            deletePreviewImage.src = '';
                            deletePreviewImage.style.display = 'none';
                        }
                        if(deletePreviewTitle) {
                            deletePreviewTitle.textContent = '';
                        }
                    }
                }
            });
        }
        
        deleteForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const movieToDelete = deleteInput.value.toLowerCase().trim();
            await deleteMovie(movieToDelete);
            location.reload();
        });
    }
});

// Función para obtener películas usando la API de GitHub (se evita la caché)
async function fetchMovies() {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${jsonFilePath}`;
    try {
        const response = await fetch(apiUrl, {
            headers: { 
                Authorization: `token ${accessToken}`, 
                Accept: "application/vnd.github.v3+json" 
            },
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`Error al cargar películas: ${response.status}`);
        const fileData = await response.json();
        // Decodificar el contenido en Base64
        const decoded = decodeURIComponent(escape(atob(fileData.content)));
        const movies = decoded.trim() ? JSON.parse(decoded) : [];
        return movies;
    } catch (error) {
        console.error("Error obteniendo películas:", error);
        return [];
    }
}

// Función para actualizar JSON en GitHub (usa la API para obtener el contenido actual)
async function updateMovies(newMovie) {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${jsonFilePath}`;
    try {
        const getResponse = await fetch(apiUrl, {
            headers: { 
                Authorization: `token ${accessToken}`, 
                Accept: "application/vnd.github.v3+json" 
            }
        });
        if (!getResponse.ok) throw new Error("No se pudo obtener el archivo de películas.");
        const fileData = await getResponse.json();
        const sha = fileData.sha;
        let movies = [];
        if(fileData.content) {
            const decoded = decodeURIComponent(escape(atob(fileData.content)));
            movies = decoded.trim() ? JSON.parse(decoded) : [];
        }
        // Agregar la nueva película al inicio para mostrarla como la más reciente
        movies.unshift(newMovie);
        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(movies, null, 2))));
        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `token ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Agregar nueva película",
                content: updatedContent,
                sha
            })
        });
        if (!putResponse.ok) throw new Error("No se pudo actualizar el archivo en GitHub.");
    } catch (error) {
        console.error("Error actualizando películas:", error);
    }
}

// Función para eliminar películas usando la API de GitHub
async function deleteMovie(movieName) {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${jsonFilePath}`;
    try {
        const getResponse = await fetch(apiUrl, {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: "application/vnd.github.v3+json"
            }
        });
        if (!getResponse.ok) throw new Error("No se pudo obtener el archivo de películas.");
        const fileData = await getResponse.json();
        const sha = fileData.sha;
        let movies = [];
        if(fileData.content) {
            const decoded = decodeURIComponent(escape(atob(fileData.content)));
            movies = decoded.trim() ? JSON.parse(decoded) : [];
        }
        let filteredMovies;
        if (movieName === "todas") {
            filteredMovies = [];
        } else {
            filteredMovies = movies.filter(
                movie => movie.movieName.toLowerCase() !== movieName
            );
        }
        if (filteredMovies.length === movies.length) {
            alert("No se encontró la película para eliminar.");
            return;
        }
        const updatedContent = btoa(
            unescape(encodeURIComponent(JSON.stringify(filteredMovies, null, 2)))
        );
        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `token ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Eliminar película: ${movieName}`,
                content: updatedContent,
                sha
            })
        });
        if (!putResponse.ok) throw new Error("No se pudo eliminar la película.");
        alert("Película eliminada correctamente.");
    } catch (error) {
        console.error("Error eliminando película:", error);
    }

    // Previsualización al eliminar
const deletePreviewContainer = document.getElementById('delete-preview');
const deletePreviewImage = document.getElementById('delete-preview-image');
const deletePreviewTitle = document.getElementById('delete-preview-title');

if(deleteInput) {
    deleteInput.addEventListener('input', async function () {
        let movies = await fetchMovies();
        const inputVal = deleteInput.value.trim().toLowerCase();
        if(inputVal === 'todas'){
            // Mostrar mensaje de eliminación total y hacer visible el contenedor de previsualización
            deletePreviewImage.src = '';
            deletePreviewImage.style.display = 'none';
            deletePreviewTitle.textContent = 'Se eliminarán todas las películas';
            deletePreviewContainer.style.display = 'block';
        } else {
            let foundMovie = movies.find(movie => movie.movieName.toLowerCase() === inputVal);
            if(foundMovie) {
                deletePreviewImage.src = foundMovie.imageUrl;
                deletePreviewImage.style.display = 'block';
                deletePreviewTitle.textContent = foundMovie.movieName;
                deletePreviewContainer.style.display = 'block';
            } else {
                // Si no se encuentra la película, ocultar el contenedor de previsualización
                deletePreviewImage.src = '';
                deletePreviewImage.style.display = 'none';
                deletePreviewTitle.textContent = '';
                deletePreviewContainer.style.display = 'none';
            }
        }
    });
}

}
